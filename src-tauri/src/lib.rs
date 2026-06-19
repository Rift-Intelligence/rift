use tauri::{WebviewUrl, WebviewWindowBuilder};

/// Resolve the URL the desktop window loads.
///
/// Priority:
///   1. `RIFT_DESKTOP_URL` env var (manual override — point at any host)
///   2. debug build  → local dev server (http://localhost:3010)
///   3. release build → cloud (https://riftsys.app)
fn resolve_app_url() -> String {
  if let Ok(url) = std::env::var("RIFT_DESKTOP_URL") {
    if !url.trim().is_empty() {
      return url;
    }
  }

  if cfg!(debug_assertions) {
    "http://localhost:3010".to_string()
  } else {
    "https://riftsys.app".to_string()
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let url_str = resolve_app_url();
      let mut url = tauri::Url::parse(&url_str).expect("invalid RIFT desktop URL");
      // Mark this as the lite wrapper via a query param. Unlike init scripts,
      // query params are reliable on remote URLs — the web app reads it on
      // first load, persists it to localStorage, and treats the session as a
      // normal web client (cloud sandbox) instead of expecting a native
      // desktop bridge this wrapper doesn't ship.
      url.query_pairs_mut().append_pair("rift_desktop", "lite");

      WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
        .title("RIFT")
        .inner_size(1280.0, 800.0)
        .min_inner_size(900.0, 600.0)
        .resizable(true)
        .initialization_script("window.__RIFT_DESKTOP_LITE__ = true;")
        .build()?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
