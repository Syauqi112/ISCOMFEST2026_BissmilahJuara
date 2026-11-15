import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * Nomor commit pendek untuk footer (lihat docs/UI.md). Dibaca saat build, bukan
 * di browser. Di Docker build tidak ada folder .git, jadi jatuh ke "dev".
 */
function commitPendek() {
  if (process.env.NEXT_PUBLIC_COMMIT) return process.env.NEXT_PUBLIC_COMMIT;
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "dev";
  }
}

/** Waktu build (WIB). Selalu ada, termasuk di Docker/VPS yang tidak punya .git. */
const waktuBuild = new Date().toLocaleString("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const nextConfig: NextConfig = {
  devIndicators: false,
  env: { NEXT_PUBLIC_COMMIT: commitPendek(), NEXT_PUBLIC_BUILD: waktuBuild },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Dipakai Dockerfile (deploy VPS). Lokal tetap `npm run dev`.
  output: "standalone",
  // Browser cuma kenal satu origin: /api/* diteruskan ke Express (lokal :4000, VPS lewat build arg API_URL).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_URL ?? "http://localhost:4000"}/api/:path*` }];
  },
  experimental: {
    proxyTimeout: 120_000, // default 30 dtk, panggilan AI bisa lebih lama
  },
};

export default nextConfig;
