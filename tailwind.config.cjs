/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './extension/src/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.{css,scss}'
  ],
  theme: {
    extend: {
      colors: {
        // Bluesky-like palette
        primary: {
          light: '#4F8CFF', // Bluesky blue
          DEFAULT: '#007AFF',
          dark: '#0051A8',
        },
        background: {
          light: '#F8FAFC', // Light background
          DEFAULT: '#FFFFFF',
          dark: '#181C20', // Bluesky dark background
        },
        surface: {
          light: '#FFFFFF',
          DEFAULT: '#F1F5F9',
          dark: '#23272C',
        },
        border: {
          light: '#E2E8F0',
          DEFAULT: '#CBD5E1',
          dark: '#2D333A',
        },
        text: {
          light: '#181C20',
          DEFAULT: '#23272C',
          dark: '#F8FAFC',
        },
        accent: {
          light: '#FFD600',
          DEFAULT: '#FFB300',
          dark: '#FF8C00',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
