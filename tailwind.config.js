/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bruck: {
          green: '#31AE79',
          'green-light': '#99D0B8',
          'green-dark': '#163C30',
          'green-deep': '#0E241D',
          'bg-primary': '#090B0A',
          'bg-secondary': '#111512',
          'bg-tertiary': '#171C19',
          'cream-primary': '#F3EFE5',
          'cream-secondary': '#E8E1D2',
          'white-warm': '#F5F5F2',
          'text-secondary': '#B8BDB9',
          'text-tertiary': '#858C87',
          'text-dark': '#121714',
          'border-dark': '#2A302C',
          'border-light': '#D8D1C4',
          error: '#E47B68',
          warning: '#D9AD5B',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
