/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#09090f',
        surf:   '#13131e',
        surf2:  '#17171e',
        surf3:  '#1e1e28',
        border: 'rgba(148,245,216,0.1)',
        mint:   '#60a5fa',
        teal:   '#60a5fa',
        accent: '#60a5fa',
        gold:   '#F5C842',
        red:    '#E84545',
        green:  '#2DC653',
        purple: '#B39DDB',
        orange: '#F4845F',
        muted:  'rgba(148,245,216,0.3)',
      },
      fontFamily: {
        sans:    ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}
