/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server-only native/node modules + pdfjs-dist (loaded lazily, browser-only in
  // the plugin) are kept external so the server bundle never tries to inline the
  // pdf.js worker.
  serverExternalPackages: ['better-sqlite3', 'nodemailer', 'bcryptjs', 'pdfjs-dist'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // The imposition plugin loads the pdf.js worker via a Vite-style `?url`
    // import (wrapped in try/catch). Teach webpack to emit that asset and return
    // its URL, matching Vite's behaviour.
    config.module.rules.push({ resourceQuery: /url/, type: 'asset/resource' });
    return config;
  },
};

export default nextConfig;
