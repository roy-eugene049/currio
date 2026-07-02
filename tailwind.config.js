/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#8B5CF6',
        accent: '#06B6D4',
        background: '#F8FAFC',
        dark: '#0F172A',
        card: '#FFFFFF',
        'card-dark': '#1E293B',
        muted: '#64748B',
        border: '#E2E8F0',
        'border-dark': '#334155',
      },
      borderRadius: {
        card: '24px',
      },
      fontFamily: {
        sans: ['System'],
      },
      boxShadow: {
        soft: '0 4px 24px rgba(15, 23, 42, 0.08)',
        'soft-dark': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
