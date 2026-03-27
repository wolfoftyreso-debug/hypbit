/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#07080F',
        card: '#0D0F1A',
        card2: '#131520',
        border: 'rgba(255,255,255,0.07)',
        accent: '#8B5CF6',
        'accent-dim': 'rgba(139,92,246,0.15)',
        'text-primary': '#F1F1F5',
        'text-secondary': '#9CA3AF',
        'text-muted': '#4B5563',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      minHeight: {
        touch: '44px',
      },
      screens: {
        mobile: '390px',
      },
    },
  },
  plugins: [],
}
