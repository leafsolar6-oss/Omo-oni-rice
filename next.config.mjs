/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native/server-only modules kept out of the bundle
  serverExternalPackages: ['better-sqlite3', 'pg'],
};

export default nextConfig;
