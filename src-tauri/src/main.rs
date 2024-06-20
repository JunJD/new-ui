#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod car_api;
use car_api::car_api::{fetch_battery_number, fetch_car_number, ResponseData};
use chrono::Local;
use image::Luma;
use qrcode::QrCode;
use serde::Serialize;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};
use tokio::sync::Semaphore;
use tokio::task::spawn_blocking;
use regex::Regex;

struct AppState {
    is_paused: Arc<AtomicBool>,
    is_cancelled: Arc<AtomicBool>,
}

#[tauri::command]
async fn pause_execution(app_handle: AppHandle) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    state.is_paused.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
async fn resume_execution(app_handle: AppHandle) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    state.is_paused.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
async fn cancel_execution(app_handle: AppHandle) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    state.is_cancelled.store(true, Ordering::SeqCst);
    Ok(())
}

async fn write_to_desktop(
    content: String,
    file_lock: Arc<Mutex<()>>,
    path: PathBuf,
) -> Result<PathBuf, String> {
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;

    let result = spawn_blocking(move || {
        let _lock = file_lock.lock().unwrap();
        let mut file = OpenOptions::new()
            .create(true)
            .write(true)
            .append(true)
            .open(&path)
            .map_err(|e| format!("Unable to open file: {}", e))?;
        writeln!(file, "{}", content).map_err(|e| format!("Unable to write to file: {}", e))?;
        Ok(path)
    })
    .await;

    result.map_err(|e| format!("Task panicked: {:?}", e))?
}

async fn save_qr_code(
    content: &str,
    file_lock: Arc<Mutex<()>>,
    path: PathBuf,
) -> Result<PathBuf, String> {
    println!("Saving QR code to {}", path.display());
    let content = content.to_string();
    spawn_blocking(move || {
        let _lock = file_lock.lock().unwrap();

        let code = QrCode::new(&content).map_err(|e| format!("Failed to create QR code: {}", e))?;
        let image = code.render::<Luma<u8>>().build();
        image
            .save(&path)
            .map_err(|e| format!("Failed to save QR code image: {}", e))?;
        Ok(path)
    })
    .await
    .map_err(|e| format!("Task panicked: {:?}", e))?
}

#[derive(Serialize, Clone)]
struct SomeStruct<T> {
    value: T,
}

#[derive(Debug, Serialize, Clone)]
struct CarInfo {
    value: String,
    status: String,
    battery_model: Option<String>,
    battery_type: Option<String>,
    bfn_or_oe: Option<String>,
    brand: Option<String>,
}
#[derive(Debug, Serialize, Clone)]
struct BatteryInfo {
    value: String,
    status: String,
    battery_model: Option<String>,
    battery_type: Option<String>,
    bfn_or_oe: Option<String>,
}

#[tauri::command]
async fn find_valid_electro_car_by_ids(
    array: Vec<String>,
    token: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    state.is_cancelled.store(false, Ordering::SeqCst);
    let semaphore = Arc::new(Semaphore::new(5));
    let file_lock = Arc::new(Mutex::new(()));
    let time = Local::now().format("%Y-%m-%d_%H:%M:%S").to_string();
    let mut path: PathBuf = dirs::desktop_dir().ok_or("Unable to find desktop directory")?;
    let folder_name = format!("ElectroCarData{}", time);
    path.push(&folder_name);
    std::fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))?;
    let txt_file_path: PathBuf = "car_data.txt".into();
    path.push(&txt_file_path);
    let qr_folder_path = path.with_file_name("qrcode");
    std::fs::create_dir_all(&qr_folder_path)
        .map_err(|e| format!("Failed to create QR folder: {}", e))?;

    let mut tasks = Vec::new();
    for value in array {
        let semaphore = semaphore.clone();
        let file_lock = file_lock.clone();
        let token = token.clone();
        let txt_file_path = path.clone();
        // 将URL中不适合做路径的字符替换成下划线
        let re = Regex::new(r"[^\w\d]").unwrap();
        let safe_value = re.replace_all(&value, "_");
        let qr_code_path = qr_folder_path.join(format!("车架号{}.png", safe_value));
        let is_paused = app_handle.state::<AppState>().is_paused.clone();
        let is_cancelled = app_handle.state::<AppState>().is_cancelled.clone();

        let task = tokio::spawn(async move {
            let permit: tokio::sync::SemaphorePermit = semaphore.acquire().await.unwrap();
            let car_number_result = fetch_car_number(&token, &value).await;
            while is_paused.load(Ordering::SeqCst) {
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
            if is_cancelled.load(Ordering::SeqCst) {
                return None;
            }
            let info = match car_number_result {
                Ok(response_data) => {
                    let ResponseData { code, data } = response_data;
                    let info = if code == 0 {
                        let car_info = CarInfo {
                            value: value.clone(),
                            status: "success".to_string(),
                            battery_model: data
                                .get("dcxh")
                                .and_then(|v| v.as_str())
                                .map(String::from),
                            battery_type: data
                                .get("dclx")
                                .and_then(|v| v.as_str())
                                .map(String::from),
                            bfn_or_oe: data.get("dcpp").and_then(|v| v.as_str()).map(String::from),
                            brand: data.get("zwpp").and_then(|v| v.as_str()).map(String::from),
                        };
                        let _ = write_to_desktop(
                            value.clone(),
                            file_lock.clone(),
                            txt_file_path.clone(),
                        )
                        .await;
                        let _ = save_qr_code(&value, file_lock.clone(), qr_code_path.clone()).await;

                        car_info
                    } else {
                        CarInfo {
                            value: value.clone(),
                            status: "error".to_string(),
                            battery_model: None,
                            battery_type: None,
                            bfn_or_oe: None,
                            brand: None,
                        }
                    };
                    info
                }
                Err(e) => {
                    eprintln!("Error fetching car number: {}", e);
                    CarInfo {
                        value: value.clone(),
                        status: "error".to_string(),
                        battery_model: None,
                        battery_type: None,
                        bfn_or_oe: None,
                        brand: None,
                    }
                }
            };
            drop(permit);
            Some(info)
        });
        tasks.push(task);
    }

    let infos = futures::future::join_all(tasks).await;
    for info in infos {
        if let Ok(info) = info {
            app_handle.emit_all("updateList", info).unwrap_or_else(|e| {
                eprintln!("Failed to emit event: {}", e);
            });
        }
    }

    app_handle
        .emit_all("updateList", SomeStruct { value: "end" })
        .unwrap_or_else(|e| {
            eprintln!("Failed to emit event: {}", e);
        });

    Ok(())
}

#[tauri::command]
async fn find_battery_nums_by_ids(
    array: Vec<String>,
    token: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    state.is_cancelled.store(false, Ordering::SeqCst);
    let semaphore = Arc::new(Semaphore::new(5));
    let file_lock = Arc::new(Mutex::new(()));
    let time = Local::now().format("%Y-%m-%d_%H:%M:%S").to_string();
    let mut path: PathBuf = dirs::desktop_dir().ok_or("Unable to find desktop directory")?;
    let folder_name = format!("BatteryInfoData{}", time);
    path.push(&folder_name);
    std::fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))?;
    let txt_file_path: PathBuf = "battery_data.txt".into();
    path.push(&txt_file_path);
    let qr_folder_path = path.with_file_name("qrcode");
    std::fs::create_dir_all(&qr_folder_path)
        .map_err(|e| format!("Failed to create QR folder: {}", e))?;

    let mut tasks = Vec::new();
    for value in array {
        let semaphore = semaphore.clone();
        let file_lock = file_lock.clone();
        let token = token.clone();
        let txt_file_path = path.clone();
        // 将URL中不适合做路径的字符替换成下划线
        let re = Regex::new(r"[^\w\d]").unwrap();
        let safe_value = re.replace_all(&value, "_");
        let qr_code_path = qr_folder_path.join(format!("电池码{}.png", safe_value));
        let is_paused = app_handle.state::<AppState>().is_paused.clone();
        let is_cancelled = app_handle.state::<AppState>().is_cancelled.clone();

        let task = tokio::spawn(async move {
            let permit: tokio::sync::SemaphorePermit = semaphore.acquire().await.unwrap();
            let car_number_result = fetch_battery_number(&token, &value).await;
            while is_paused.load(Ordering::SeqCst) {
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
            if is_cancelled.load(Ordering::SeqCst) {
                return None;
            }
            let info = match car_number_result {
                Ok(response_data) => {
                    let ResponseData { code, data } = response_data;
                    let info = if code == 0 {
                        let car_info = BatteryInfo {
                            value: value.clone(),
                            status: "success".to_string(),
                            battery_model: data
                                .get("dcxh")
                                .and_then(|v| v.as_str())
                                .map(String::from),
                            battery_type: data
                                .get("dclx")
                                .and_then(|v| v.as_str())
                                .map(String::from),
                            bfn_or_oe: data.get("dcpp").and_then(|v| v.as_str()).map(String::from),
                        };
                        let _ = write_to_desktop(
                            value.clone(),
                            file_lock.clone(),
                            txt_file_path.clone(),
                        )
                        .await;
                        let _ = save_qr_code(&value, file_lock.clone(), qr_code_path.clone()).await;

                        car_info
                    } else {
                        BatteryInfo {
                            value: value.clone(),
                            status: "error".to_string(),
                            battery_model: None,
                            battery_type: None,
                            bfn_or_oe: None,
                        }
                    };
                    info
                }
                Err(e) => {
                    eprintln!("Error fetching car number: {}", e);
                    BatteryInfo {
                        value: value.clone(),
                        status: "error".to_string(),
                        battery_model: None,
                        battery_type: None,
                        bfn_or_oe: None,
                    }
                }
            };
            drop(permit);
            Some(info)
        });
        tasks.push(task);
    }

    let infos = futures::future::join_all(tasks).await;
    for info in infos {
        if let Ok(info) = info {
            app_handle.emit_all("updateBatteryInfoList", info).unwrap_or_else(|e| {
                eprintln!("Failed to emit event: {}", e);
            });
        }
    }

    app_handle
        .emit_all("updateBatteryInfoList", SomeStruct { value: "end" })
        .unwrap_or_else(|e| {
            eprintln!("Failed to emit event: {}", e);
        });

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(AppState {
                is_paused: Arc::new(AtomicBool::new(false)),
                is_cancelled: Arc::new(AtomicBool::new(false)),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            find_valid_electro_car_by_ids,
            find_battery_nums_by_ids,
            pause_execution,
            resume_execution,
            cancel_execution
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
