fn main() {
    println!(
        "cargo:rustc-env=TESTRILL_TARGET={}",
        std::env::var("TARGET").unwrap()
    );
    tauri_build::build()
}
