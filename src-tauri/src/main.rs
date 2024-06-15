#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use tokio::task;

async fn write_to_desktop(filename: String, content: String) -> Result<PathBuf, String> {
    let mut path = dirs::desktop_dir().ok_or("Unable to find desktop directory")?;
    print!("{}", path.to_str().unwrap());
    path.push(filename);

    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("Unable to open file: {}", e))?;

    writeln!(file, "{}", content).map_err(|e| format!("Unable to write to file: {}", e))?;
    Ok(path)
}

#[tauri::command]
async fn write_multiple_times(filename: String, content: String, times: usize) -> Result<Vec<PathBuf>, String> {
    let mut handles = vec![];
    for i in 0..times {
        let content = format!("{} - Line number {}", content, i);
        let filename = filename.clone();
        handles.push(task::spawn(write_to_desktop(filename, content)));
    }

    let mut paths = vec![];
    for handle in handles {
        paths.push(handle.await.map_err(|e| format!("Task failed: {:?}", e))??);
    }

    Ok(paths)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![write_multiple_times])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
