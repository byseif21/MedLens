/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Medical color palette
        medical: {
          primary: '#0891b2', // Cyan-600 (teal)
          secondary: '#0ea5e9', // Sky-500
          accent: '#10b981', // Emerald-500 (soft green)
          light: '#f0f9ff', // Sky-50
          dark: '#0c4a6e', // Sky-900
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          },
        },
      },
      backgroundImage: {
        'medical-gradient': 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        'medical-card': 'linear-gradient(to bottom right, #ffffff, #f8fafc)',
      },
      boxShadow: {
        medical: '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)',
        'medical-lg':
          '0 10px 15px -3px rgba(8, 145, 178, 0.1), 0 4px 6px -2px rgba(8, 145, 178, 0.05)',
        'medical-hover':
          '0 20px 25px -5px rgba(8, 145, 178, 0.15), 0 10px 10px -5px rgba(8, 145, 178, 0.04)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
