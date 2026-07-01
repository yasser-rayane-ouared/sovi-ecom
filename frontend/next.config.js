/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    // Strip console.log in production builds to reduce bundle size
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    // Tree-shake heavy libraries so only used icons/components are bundled
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', '@tiptap/react', '@tiptap/starter-kit'],
  },
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
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
