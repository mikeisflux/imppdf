/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 and nodemailer are server-only native/node modules; keep them external.
  serverExternalPackages: ['better-sqlite3', 'nodemailer', 'bcryptjs'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
