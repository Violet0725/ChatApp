/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord_gray: '#313338',       // Main chat background
        discord_sidebar: '#1E1F22',    // Left sidebar
        discord_channels: '#2B2D31',   // Channel list background
        discord_hover: '#3F4147',      // Hover effect
        discord_purple: '#5865F2',     // The classic blurple
      }
    },
  },
  plugins: [],
}