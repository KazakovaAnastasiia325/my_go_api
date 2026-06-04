/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  extend: {
    animation: {
      'pulse-slow': 'pulse-slow 6s ease-in-out infinite', // ускорили с 8 до 6 сек
    },
    keyframes: {
      'pulse-slow': {
        '0%, 100%': { transform: 'scale(1)', opacity: '0.3' },
        '50%': { transform: 'scale(1.5)', opacity: '0.7' }, // масштаб 1.5 - точно будет видно!
      }
    }
  },
},
  plugins: [],
}