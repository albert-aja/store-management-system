/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '3xl': '1.25rem' },
      fontWeight: { extrabold: '700', black: '700' },
      boxShadow: {
        sm: '0 1px 2px rgb(15 23 42 / 0.03)',
        md: '0 4px 12px rgb(15 23 42 / 0.05)',
        lg: '0 8px 24px rgb(15 23 42 / 0.06)',
        xl: '0 12px 32px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
};
