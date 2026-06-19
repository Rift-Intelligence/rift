// Desktop builds are published as a public GitHub release so the binaries are
// downloadable without exposing the (private) source repo.
const GITHUB_RELEASE_BASE =
  "https://github.com/cettocdx/rift-releases/releases/latest/download";

export const downloadLinks = {
  macos: `${GITHUB_RELEASE_BASE}/RIFT-mac.dmg`,
  windows: `${GITHUB_RELEASE_BASE}/RIFT-windows-x64-setup.exe`,
};
