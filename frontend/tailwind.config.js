/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['-apple-system', 'Inter', 'system-ui', 'sans-serif'],
        },
        colors: {
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            500: '#6B7280',
            700: '#374151',
            900: '#111827',
          }
        },
        spacing: {
          'xs': '0.5rem',
          'sm': '1rem',
          'md': '1.5rem',
          'lg': '2rem',
          'xl': '3rem',
        },
        transitionDuration: {
          '150': '150ms',
        },
        transitionTimingFunction: {
          'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        }
      },
    },
    plugins: [],
  }