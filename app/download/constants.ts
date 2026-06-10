const GITHUB_RELEASE_BASE =
  "https://github.com/hackerai-tech/hackerai/releases/latest/download";

export const downloadLinks = {
  macos: `${GITHUB_RELEASE_BASE}/EYE-universal.dmg`,
  windows: `${GITHUB_RELEASE_BASE}/EYE-windows-x64.exe`,
  linuxAppImage: `${GITHUB_RELEASE_BASE}/EYE-linux-x64.AppImage`,
  linuxArm64AppImage: `${GITHUB_RELEASE_BASE}/EYE-linux-arm64.AppImage`,
  linuxDeb: `${GITHUB_RELEASE_BASE}/EYE-linux-x64.deb`,
  linuxArm64Deb: `${GITHUB_RELEASE_BASE}/EYE-linux-arm64.deb`,
};
