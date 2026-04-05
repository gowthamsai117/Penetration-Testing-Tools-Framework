/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#09090b", // Modern Zinc 950
          card: "#18181b", // Modern Zinc 900
          text: "#fafafa", // Modern Zinc 50
          muted: "#a1a1aa", // Modern Zinc 400
          border: "#27272a", // Modern Zinc 800
          primary: "#FF3838", // Preserved User Red
          secondary: "#3b82f6", // Modern Blue
          accent: "#8b5cf6", // Modern Purple
          danger: "#ef4444", // Modern Red
          success: "#10b981", // Modern Emerald
        }
      },
      boxShadow: {
        'modern-glow': '0 0 20px -5px rgba(255, 56, 56, 0.3)',
        'modern-blue': '0 0 20px -5px rgba(59, 130, 246, 0.3)',
        'glass': '0 0 0 1px rgba(255,255,255,0.05), 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'], // Suggest adding a google font link in index.html later if needed
        sans: ['"Inter"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}