/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./renderer/index.html",
    "./renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ghost: {
          // Background colors - mais escuros e neutros
          bg: {
            primary: '#000000',
            secondary: '#0a0a0a',
            tertiary: '#141414',
          },
          // Accent colors - blue neutro ao invés de violet
          accent: {
            primary: '#3b82f6',    // blue-500
            secondary: '#60a5fa',  // blue-400
            tertiary: '#93c5fd',   // blue-300
          },
          // Status colors
          status: {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
          },
          // Glass colors (rgba) - mais sutis
          glass: {
            100: 'rgba(255, 255, 255, 0.03)',
            200: 'rgba(255, 255, 255, 0.05)',
            300: 'rgba(255, 255, 255, 0.08)',
            400: 'rgba(255, 255, 255, 0.12)',
            500: 'rgba(255, 255, 255, 0.15)',
          },
          // Border colors - mais sutis
          border: {
            subtle: 'rgba(255, 255, 255, 0.04)',
            default: 'rgba(255, 255, 255, 0.08)',
            strong: 'rgba(255, 255, 255, 0.15)',
          },
          // Text colors
          text: {
            primary: '#ffffff',
            secondary: '#a1a1aa',
            tertiary: '#71717a',
            muted: '#52525b',
          }
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Courier New',
          'monospace'
        ]
      },
      backdropBlur: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
      backgroundImage: {
        'gradient-ghost': 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
        'gradient-accent': 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'accent': '0 10px 40px -10px rgba(59, 130, 246, 0.3)',
        'accent-lg': '0 20px 60px -15px rgba(59, 130, 246, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
