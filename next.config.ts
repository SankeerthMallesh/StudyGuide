import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  // Keep Turbopack scoped to this app instead of searching parent folders.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
