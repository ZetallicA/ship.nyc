/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#2563eb',
          orange: '#f97316',
          purple: '#9333ea',
        },
      },
    },
  },
  plugins: [],
}

