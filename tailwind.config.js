/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6F00FF',
        secondary: '#E1B0FF',
        accent: '#31006E',
        background: '#FFF2F2',
        dark: '#31006E',
        card: '#FFFFFF',
        'card-dark': '#4A0A99',
        muted: '#9478B5',
        border: '#EDE0FF',
        'border-dark': '#5A2088',
      },
      borderRadius: {
        card: '24px',
      },
      fontFamily: {
        sans: ['System'],
      },
      boxShadow: {
        soft: '0 4px 24px rgba(49, 0, 110, 0.08)',
        'soft-dark': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
