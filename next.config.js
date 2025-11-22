/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export for Capacitor
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true,
  distDir: 'out',
};

module.exports = nextConfig;

