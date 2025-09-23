/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        highlight: 'var(--color-highlight)',
        'highlight-dark': 'var(--color-highlight-dark)',

        background: 'var(--color-background)',
        'background-white': 'var(--color-background-white)',
        'background-secondary': 'var(--color-background-secondary)',

        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',

        border: 'var(--color-border)',

        accent: 'var(--color-accent)',
        'accent-dark': 'var(--color-accent-dark)',
      },
    },
  },
  safelist: [
    {
      pattern: /variant-(default|primary|highlight)/,
    },
  ],
  plugins: [],
};
