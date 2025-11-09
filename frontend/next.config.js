/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
  // Disable Next.js dev indicators and overlays
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-left',
  },
  // Disable React DevTools overlay
  reactDevOverlay: false,
}

module.exports = nextConfig

