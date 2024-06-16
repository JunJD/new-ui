use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde::Serialize;
use tauri::{AppHandle, Manager};
use tokio::task::spawn_blocking;
use tokio::sync::Semaphore;

async fn write_to_desktop(content: String, file_lock: Arc<Mutex<()>>) -> Result<PathBuf, String> {
    // 延迟3秒
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;

    // 使用 spawn_blocking 将文件写入操作放到阻塞任务中执行
    let result = spawn_blocking(move || {
        // 获取桌面目录路径
        let mut path: PathBuf = dirs::desktop_dir().ok_or("Unable to find desktop directory")?;
        // 将文件名添加到路径中
        path.push("new_auto_log.txt");

        // 锁定文件写入操作
        let _lock = file_lock.lock().unwrap();

        // 打开文件，如果不存在则创建，允许写入和追加
        let mut file = OpenOptions::new()
            .create(true)
            .write(true)
            .append(true)
            .open(&path)
            .map_err(|e| format!("Unable to open file: {}", e))?;

        // 写入内容到文件
        writeln!(file, "{}", content).map_err(|e| format!("Unable to write to file: {}", e))?;
        // 返回文件路径
        Ok(path)
    }).await;

    // 使用 ? 操作符展开 Result，将嵌套的 Result 转换为单层 Result
    result.map_err(|e| format!("Task panicked: {:?}", e))?
}

#[derive(Serialize, Clone)]
struct SomeStruct<T> {
    value: T,
}

#[tauri::command]
async fn find_valid_electro_car_by_ids(array: Vec<String>, app_handle: AppHandle) -> Result<Vec<PathBuf>, String> {
    // 创建一个限制为5个并发任务的信号量
    let semaphore = Arc::new(Semaphore::new(5));

    // 创建一个文件写入操作的全局锁
    let file_lock = Arc::new(Mutex::new(()));

    let mut results = Vec::new();
    println!("!!!--find_valid_electro_car_by_ids====>start===>{}", array.len());
    for value in array {
        let app_handle = app_handle.clone();
        let semaphore = semaphore.clone();
        let file_lock = file_lock.clone();
        println!("!!!--start===>{}", value);
        // 启动异步任务
        let task = tokio::spawn(async move {
            // 获取信号量许可，阻塞直到获得许可
            let permit = semaphore.acquire().await.unwrap();

            // 执行写入操作
            let result = write_to_desktop(value.clone(), file_lock.clone()).await;

            // 任务完成后释放信号量许可
            drop(permit);

            if let Ok(_) = result {
                println!("Found valid electro car: {}", value);
                app_handle.emit_all("updateList", SomeStruct { value: value }).unwrap_or_else(|e| {
                    eprintln!("Failed to emit event: {}", e);
                });
            }

            result
        });

        results.push(task);
    }

    // 等待所有任务完成
    let paths = futures::future::join_all(results).await.into_iter().filter_map(|res| res.ok().and_then(|r| r.ok())).collect::<Vec<_>>();

    println!("!!!--end");
    app_handle.emit_all("updateList", SomeStruct { value: "end".to_string() }).unwrap_or_else(|e| {
        eprintln!("Failed to emit event: {}", e);
    });

    Ok(paths)
}

fn main() {
    // 创建 Tauri 应用程序
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            app.manage(app_handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![find_valid_electro_car_by_ids])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
