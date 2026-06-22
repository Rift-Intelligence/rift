// Desktop installers are served as static assets from the app's own public
// folder (riftsys.app/downloads/...), so they're publicly downloadable
// without exposing the private source repo or a separate releases repo.
export const downloadLinks = {
  macos: "/downloads/RIFT-mac.dmg",
  windows: "/downloads/RIFT-windows-x64-setup.exe",
};
