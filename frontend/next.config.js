/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
  // Disable Next.js dev overlay to remove "Static route" indicator
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-left',
  },
}

module.exports = nextConfig

