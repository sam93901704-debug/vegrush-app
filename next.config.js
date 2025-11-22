/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  images: {
    unoptimized: false,
  },
  trailingSlash: true,
};

module.exports = nextConfig;

