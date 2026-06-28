/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev', // Allows cloudflare R2 loaded assets
      },
      {
        protocol: 'https',
        hostname: '*.ngrok-free.dev', // Allows ngrok tunnel for local testing
      },
      {
        protocol: 'https',
        hostname: '*.ngrok-free.app', // Allows ngrok tunnel for local testing
      },
    ],
  },
  // Allow ngrok origin for dev cross-origin requests
  allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok-free.app'],
};

module.exports = nextConfig;
