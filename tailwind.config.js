/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#0b1120',
          panel: '#1e293b',
          accent: '#334155',
          highlight: '#6366f1',
          'highlight-soft': '#818cf8',
          text: '#f1f5f9',
          muted: '#94a3b8',
          success: '#34d399',
          danger: '#f87171',
          bubble: {
            player: '#312e81',
            npc: '#1e293b',
            narration: '#0f172a',
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
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
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99,102,241,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(99,102,241,0.6)' },
        },
      },
    },
  },
  plugins: [],
}
