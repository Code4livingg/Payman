import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f12',
        panel: '#11161b',
        panelSoft: '#151b22',
        accent: '#10b981',
        accentSoft: '#10b98122'
      },
      animation: {
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'fade-up': 'fadeUp 450ms ease-out both'
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' }
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
};

export default config;
