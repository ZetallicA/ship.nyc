/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'oath-blue': '#1e3a5f',
        'oath-gold': '#c9a227',
        'oath-secondary': '#2c5282',
        'oath-light-gray': '#f5f5f5',
        primary: {
          blue: '#2563eb',
          orange: '#f97316',
          purple: '#9333ea',
        },
      },
      animation: {
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 162, 39, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(201, 162, 39, 0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}
