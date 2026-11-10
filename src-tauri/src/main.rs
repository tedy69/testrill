#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{Manager, RunEvent};
use tauri_plugin_dialog::DialogExt;

struct EngineState {
    connection: Arc<Mutex<Result<serde_json::Value, String>>>,
    child: Mutex<Option<Child>>,
}

#[tauri::command]
fn engine_connection(state: tauri::State<EngineState>) -> Result<serde_json::Value, String> {
    state.connection.lock().map_err(|e| e.to_string())?.clone()
}

#[tauri::command]
async fn save_download(
    app: tauri::AppHandle,
    suggested_name: String,
    bytes: Vec<u8>,
) -> Result<bool, String> {
    if bytes.len() > 80_000_000 {
        return Err("Download exceeds the 80 MB limit".into());
    }
    let name = std::path::Path::new(&suggested_name)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("testrill-export.zip")
        .to_string();
    tauri::async_runtime::spawn_blocking(move || {
        if let Some(path) = app.dialog().file().set_file_name(name).blocking_save_file() {
            std::fs::write(path.into_path().map_err(|e| e.to_string())?, bytes)
                .map_err(|e| e.to_string())?;
            Ok(true)
        } else {
            Ok(false)
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

fn main() {
    let application = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![engine_connection, save_download])
        .setup(|app| {
            let directory = app.path().app_data_dir()?;
            std::fs::create_dir_all(&directory)?;
            let runtime = app.path().resource_dir()?.join("runtime");
            let executable = if cfg!(debug_assertions) {
                std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .join("binaries")
                    .join(format!(
                        "testrill-node-{}{}",
                        env!("TESTRILL_TARGET"),
                        std::env::consts::EXE_SUFFIX
                    ))
            } else {
                std::env::current_exe()?
                    .parent()
                    .ok_or("Missing application directory")?
                    .join(format!("testrill-node{}", std::env::consts::EXE_SUFFIX))
            };
            let connection = Arc::new(Mutex::new(Err("The local engine is starting".into())));
            let mut child = Command::new(executable)
                .args([
                    runtime.join("main.cjs").to_string_lossy().as_ref(),
                    "serve",
                    "--port",
                    "0",
                    "--data",
                    directory.to_string_lossy().as_ref(),
                ])
                .env("TESTRILL_RUNTIME_DIR", &runtime)
                .env("TESTRILL_UI_DIR", runtime.join("ui"))
                .current_dir(&runtime)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()?;
            let stdout = child.stdout.take().ok_or("Missing engine output")?;
            let stderr = child.stderr.take().ok_or("Missing engine diagnostics")?;
            app.manage(EngineState {
                connection: connection.clone(),
                child: Mutex::new(Some(child)),
            });
            std::thread::spawn(move || {
                for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                    if line.starts_with("TESTRILL_READY ") {
                        let value = std::fs::read(directory.join("connection.json"))
                            .map_err(|e| e.to_string())
                            .and_then(|data| {
                                serde_json::from_slice(&data).map_err(|e| e.to_string())
                            });
                        if let Ok(mut state) = connection.lock() {
                            *state = value;
                        }
                    }
                }
                if let Ok(mut state) = connection.lock() {
                    *state = Err("The local engine stopped. Restart Testrill.".into());
                }
            });
            std::thread::spawn(move || {
                for line in BufReader::new(stderr).lines().map_while(Result::ok) {
                    eprintln!("Testrill engine: {line}");
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Unable to launch Testrill");
    application.run(|app, event| {
        if let RunEvent::Exit = event {
            if let Some(state) = app.try_state::<EngineState>() {
                if let Ok(mut slot) = state.child.lock() {
                    if let Some(mut child) = slot.take() {
                        if let Some(input) = child.stdin.as_mut() {
                            let _ = input.write_all(b"shutdown\n");
                            let _ = input.flush();
                        }
                        for _ in 0..40 {
                            if matches!(child.try_wait(), Ok(Some(_))) {
                                return;
                            }
                            std::thread::sleep(std::time::Duration::from_millis(100));
                        }
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                }
            }
        }
    });
}
