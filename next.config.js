/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  images: {
    unoptimized: false,
  },
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.alias['backend'] = false;
    config.resolve.alias['backend/*'] = false;
    return config;
  },
};

module.exports = nextConfig;

