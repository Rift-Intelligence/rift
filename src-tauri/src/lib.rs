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

      // Most reliable lite signal: a custom user-agent marker. Unlike init
      // scripts / query params, the UA is present on every request (client
      // AND server) and on every navigation, so the web app can detect the
      // lite wrapper deterministically. Realistic per-OS base + marker.
      let user_agent = if cfg!(target_os = "macos") {
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 RIFTWrapperLite/1.0"
      } else if cfg!(target_os = "windows") {
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0 RIFTWrapperLite/1.0"
      } else {
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RIFTWrapperLite/1.0"
      };

      WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
        .title("RIFT")
        .inner_size(1280.0, 800.0)
        .min_inner_size(900.0, 600.0)
        .resizable(true)
        .user_agent(user_agent)
        .initialization_script("window.__RIFT_DESKTOP_LITE__ = true;")
        .build()?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
