import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['admin.lvh.me', 'bidan.lvh.me', 'localhost'],
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  typedRoutes: true,
  transpilePackages: [
    '@marketplace/marketplace-core',
    '@marketplace/platform-config',
    '@marketplace/sdk',
    '@marketplace/ui',
    '@marketplace/web',
  ],
};

export default nextConfig;
