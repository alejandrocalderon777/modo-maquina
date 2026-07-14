/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        carbon: '#111318',
        'carbon-light': '#1C1F28',
        'carbon-mid': '#252933',
        volt: '#CEFF3C',
        'volt-dim': '#A8D420',
        spartan: '#E23A2E',
        viking: '#6FD3E8',
        mapuche: '#DE782C',
        samurai: '#C9A227',
        aztec: '#7B3FA0',
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', 'Arial Narrow', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-volt': 'pulse-volt 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-volt': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'bounce-in': {
          from: { transform: 'scale(0.8)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(206,255,60,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(206,255,60,0.7)' },
        }
      }
    }
  },
  plugins: []
}
