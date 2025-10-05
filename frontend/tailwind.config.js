/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Custom breakpoints for better responsive design
        'mobile': '320px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1440px',
      },
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
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.625rem',
        'lg': '0.75rem',
        'xl': '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      transitionDuration: {
        'smooth': '300ms',
      },
    },
  },
  safelist: [
    {
      pattern: /variant-(default|primary|highlight)/,
    },
    {
      pattern: /(xs|sm|md|lg|xl|2xl):(w|h|p|m|text|flex|grid|hidden|block)/
    }
  ],
  plugins: [],
};
