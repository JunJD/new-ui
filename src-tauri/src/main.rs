#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use serde::Serialize;
use tauri::{AppHandle, Manager};
use tokio::task::spawn_blocking;
use tokio::sync::Semaphore;
use futures::future::join_all; // 导入 join_all
#[tauri::command]
async fn write_to_desktop(filename: String, content: String) -> Result<PathBuf, String> {
    // 创建一个限制为5个并发任务的信号量
    let semaphore = Semaphore::new(5);
    // 获取一个信号量许可，阻塞直到获得许可
    let permit = semaphore.acquire().await.unwrap();

    // 使用 spawn_blocking 将文件写入操作放到阻塞任务中执行
    let result = spawn_blocking(move || {
        // 获取桌面目录路径
        let mut path: PathBuf = dirs::desktop_dir().ok_or("Unable to find desktop directory")?;
        // 将文件名添加到路径中
        path.push(filename);

        // 打开文件，如果不存在则创建，允许写入和追加
        let mut file = OpenOptions::new()
            .create(true)
            .write(true)
            .append(true)
            .open(&path)
            .map_err(|e| format!("Unable to open file: {}", e))?;

        // 写入内容到文件
        writeln!(file, "{}", content + "\n").map_err(|e| format!("Unable to write to file: {}", e))?;
        // 返回文件路径
        Ok(path)
    }).await;

    // 释放信号量许可
    drop(permit);

    // 使用 ? 操作符展开 Result，将嵌套的 Result 转换为单层 Result
    result.map_err(|e| format!("Task panicked: {:?}", e))?
}

#[derive(Serialize, Clone)]
struct SomeStruct<T> {
    value: T,
}

#[tauri::command]
async fn find_valid_electro_car_by_ids(array: Vec<String>, app_handle: AppHandle) -> Result<Vec<PathBuf>, String> {
    let tasks: Vec<_> = array.into_iter().map(|value| {
        let app_handle = app_handle.clone();
        async move {
            let result = write_to_desktop("Found valid electro car".to_string(), value.clone()).await;
            if let Ok(_) = result {
                println!("Found valid electro car: {}", value);
                app_handle.emit_all("updateList", SomeStruct {value: value}).unwrap_or_else(|e| {
                    eprintln!("Failed to emit event: {}", e);
                });
            }
            result
        }
    }).collect();

    let results: Vec<Result<PathBuf, String>> = join_all(tasks).await;
    let paths: Vec<PathBuf> = results.into_iter().filter_map(Result::ok).collect();
    println!("!!!--{}","end");
    app_handle.emit_all("updateList", SomeStruct {value: "end".to_string()}).unwrap_or_else(|e| {
        eprintln!("Failed to emit event: {}", e);
    });
    Ok(paths)
}


#[tauri::command]
async fn delete_files_with_prefix() -> Result<(), String> {
    // 创建一个限制为5个并发任务的信号量
    let semaphore = Semaphore::new(5);
    // 获取一个信号量许可，阻塞直到获得许可
    let permit: tokio::sync::SemaphorePermit = semaphore.acquire().await.unwrap();

    // 使用 spawn_blocking 将文件删除操作放到阻塞任务中执行
    let result = spawn_blocking(move || {
        // 获取桌面目录路径
        let desktop_dir = dirs::desktop_dir().ok_or("Unable to find desktop directory")?;

        // 遍历桌面目录下的文件
        for entry in std::fs::read_dir(&desktop_dir).map_err(|e| format!("Unable to read desktop directory: {}", e))? {
            let entry = entry.map_err(|e| format!("Unable to read directory entry: {}", e))?;
            let path = entry.path();
            
            // 检查文件名前缀
            if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
                if filename.starts_with("new_auto_log") {
                    // 删除文件
                    std::fs::remove_file(&path).map_err(|e| format!("Unable to delete file {}: {}", filename, e))?;
                }
            }
        }

        Ok(())
    }).await;

    // 释放信号量许可
    drop(permit);

    // 使用 ? 操作符展开 Result，将嵌套的 Result 转换为单层 Result
    result.map_err(|e| format!("Task panicked: {:?}", e))?
}


fn main() {
    // 创建 Tauri 应用程序
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            app.manage(app_handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![write_to_desktop, find_valid_electro_car_by_ids, delete_files_with_prefix])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
