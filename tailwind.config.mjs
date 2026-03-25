/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e1b4b', // Deep Indigo
        secondary: '#e0e7ff', // Soft Lavender (using a lighter indigo for now)
        accent: '#f59e0b', // Warm Gold
        cream: '#fafaf9',
        lavender: '#f3f4ff',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
