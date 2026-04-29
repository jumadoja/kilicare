import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        kili: {
          gold: '#F5A623',
          'gold-light': '#FFB84D',
          'gold-dark': '#D4891A',
          sunset: '#E84545',
          'sunset-light': '#FF6B6B',
          'sunset-dark': '#C73535',
          green: '#00E5A0',
          blue: '#4A9EFF',
          purple: '#A855F7',
        },
        dark: {
          bg: '#0A0A0F',
          surface: '#13131A',
          elevated: '#1C1C27',
          border: '#2A2A3A',
          'border-light': '#3A3A4A',
        },
        text: {
          primary: '#F8F8FF',
          secondary: '#C8C8D8',
          muted: '#8B8BA7',
          disabled: '#4A4A5A',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-gold':
          'linear-gradient(135deg, #F5A623 0%, #FFB84D 50%, #D4891A 100%)',
        'gradient-sunset':
          'linear-gradient(135deg, #E84545 0%, #FF6B6B 100%)',
        'gradient-dark':
          'linear-gradient(180deg, #0A0A0F 0%, #13131A 100%)',
        'gradient-card':
          'linear-gradient(135deg, #1C1C27 0%, #13131A 100%)',
        'gradient-radial-gold':
          'radial-gradient(ellipse at center, rgba(245,166,35,0.15) 0%, transparent 70%)',
        'gradient-radial-red':
          'radial-gradient(ellipse at center, rgba(232,69,69,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-gold':
          '0 0 20px rgba(245,166,35,0.3), 0 0 40px rgba(245,166,35,0.1)',
        'glow-red':
          '0 0 20px rgba(232,69,69,0.4), 0 0 60px rgba(232,69,69,0.2)',
        'glow-green': '0 0 20px rgba(0,229,160,0.3)',
        'glow-blue': '0 0 20px rgba(74,158,255,0.3)',
        card: '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover':
          '0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'sos-pulse': 'sosPulse 2s infinite',
        'heart-burst': 'heartBurst 0.4s ease-out',
        'badge-unlock': 'badgeUnlock 0.6s ease-out',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        bounceGentle: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%,100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(245,166,35,0.3)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 40px rgba(245,166,35,0.6)',
          },
        },
        slideUp: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(20px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sosPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(232,69,69,0.7)' },
          '70%': { boxShadow: '0 0 0 30px rgba(232,69,69,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(232,69,69,0)' },
        },
        heartBurst: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.4)' },
          '50%': { transform: 'scale(0.9)' },
          '75%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        badgeUnlock: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%': { transform: 'scale(1.2) rotate(10deg)', opacity: '1' },
          '80%': { transform: 'scale(0.9) rotate(-5deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;