/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#080C14',       // Deep futuristic cosmic space background
          card: '#101726',     // Card & sidebar background
          border: '#1E293B',   // Border colors
          input: '#1B2336',    // Input fields background
        },
        neon: {
          cyan: '#06B6D4',     // Vibrant cyan accent
          blue: '#3B82F6',     // High-energy blue
          purple: '#8B5CF6',   // Neon purple
          magenta: '#D946EF',  // Cosmic magenta
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.4)',
        'neon-purple': '0 0 15px rgba(139, 92, 246, 0.4)',
        'neon-magenta': '0 0 15px rgba(217, 70, 239, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
