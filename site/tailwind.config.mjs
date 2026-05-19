import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    extend: {
      fontFamily: {
        display: ['Geist', 'Sora', ...defaultTheme.fontFamily.sans],
        body:    ['DM Sans', 'Geist', ...defaultTheme.fontFamily.sans],
        mono:    ['JetBrains Mono', 'Fira Code', ...defaultTheme.fontFamily.mono],
      },

      colors: {
        base:     'var(--bg-base)',
        surface:  'var(--bg-surface)',
        raised:   'var(--bg-raised)',
        modal:    'var(--bg-modal)',
        accent:   'var(--accent-blue)',
        border:   'var(--border-default)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        beginner:     'var(--color-beginner)',
        intermediate: 'var(--color-intermediate)',
        advanced:     'var(--color-advanced)',
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',  { lineHeight: '1.125rem' }],
        sm:    ['0.875rem', { lineHeight: '1.375rem' }],
        base:  ['1rem',     { lineHeight: '1.6rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.625rem' }],
        '5xl': ['3rem',     { lineHeight: '1' }],
        '6xl': ['3.75rem',  { lineHeight: '1' }],
        '7xl': ['4.5rem',   { lineHeight: '1' }],
      },

      borderRadius: {
        DEFAULT: '6px',
        card:    '8px',
        pill:    '999px',
      },

      boxShadow: {
        card:        '0 1px 3px rgba(0,0,0,0.3)',
        modal:       '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        'glow-blue': '0 0 20px rgba(79,158,255,0.15)',
      },

      animation: {
        'slide-up':   'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fadeIn 0.4s ease both',
        'shimmer':    'shimmer 1.5s infinite',
        'scan-pulse': 'scanPulse 1.5s ease-in-out infinite',
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      maxWidth: {
        'content': '800px',
        'catalog': '1280px',
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
  ],
};
