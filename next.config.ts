import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1"],
  // The MCP SDK (used by lib/ai/mcp/*) is a server-only Node package whose
  // server entrypoints pull in express/cors/hono + Node built-ins. Keep it
  // external so the bundler require()s it at runtime instead of trying to
  // bundle those into the API route.
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
  // Tree-shake big barrel-import libs so each route only bundles the icons /
  // helpers it actually uses (lucide-react alone is imported by 100+ files).
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  ...(process.env.NODE_ENV === "development" && {
    logging: {
      serverFunctions: false,
    },
  }),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      // Convex storage domains (more specific patterns for better performance)
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "*.convex.dev",
      },
      // Fallback for other external images
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
