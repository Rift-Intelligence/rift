// Convex URL baked into the hosted rift-cli tarball. When the app's backend
// matches this, the CLI uses its own default and we omit the --convex-url flag.
const PRODUCTION_CONVEX_URL =
  "https://elated-poodle-998.eu-west-1.convex.cloud";

// Add --convex-url flag only when running against a different backend.
export const convexUrlFlag =
  process.env.NEXT_PUBLIC_CONVEX_URL &&
  process.env.NEXT_PUBLIC_CONVEX_URL !== PRODUCTION_CONVEX_URL
    ? ` --convex-url ${process.env.NEXT_PUBLIC_CONVEX_URL}`
    : "";

// Dev: run the local build directly. Prod/preview: npx the tarball hosted on
// riftsys.app — no npm publish/account needed.
export const runCommand =
  process.env.NODE_ENV === "development"
    ? "node packages/local/dist/index.js"
    : "npx https://riftsys.app/downloads/rift-cli.tgz";
