/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', 'sans-serif'],
        mono: ['Roboto Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.6875rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.375rem' }],
        lg: ['1rem', { lineHeight: '1.5rem' }],
        xl: ['1.125rem', { lineHeight: '1.625rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '3xl': ['1.5rem', { lineHeight: '2rem' }],
        '4xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        md: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        lg: '0 4px 8px 0 rgba(0, 0, 0, 0.12)',
        xl: '0 8px 16px 0 rgba(0, 0, 0, 0.15)',
        '2xl': '0 12px 24px 0 rgba(0, 0, 0, 0.18)',
      },
      colors: {
        // Theme-based colors using CSS variables
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          hover: 'rgb(var(--card-hover) / <alpha-value>)',
        },
        popover: 'rgb(var(--popover) / <alpha-value>)',
        
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          hover: 'rgb(var(--border-hover) / <alpha-value>)',
        },
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          hover: 'rgb(var(--primary-hover) / <alpha-value>)',
          active: 'rgb(var(--primary-active) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          hover: 'rgb(var(--secondary-hover) / <alpha-value>)',
          active: 'rgb(var(--secondary-active) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          hover: 'rgb(var(--muted-hover) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          active: 'rgb(var(--accent-active) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          hover: 'rgb(var(--success-hover) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
          background: 'rgb(var(--success-background) / <alpha-value>)',
        },
        
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          hover: 'rgb(var(--warning-hover) / <alpha-value>)',
          foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
          background: 'rgb(var(--warning-background) / <alpha-value>)',
        },
        
        error: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          hover: 'rgb(var(--error-hover) / <alpha-value>)',
          foreground: 'rgb(var(--error-foreground) / <alpha-value>)',
          background: 'rgb(var(--error-background) / <alpha-value>)',
        },
        
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          hover: 'rgb(var(--info-hover) / <alpha-value>)',
          foreground: 'rgb(var(--info-foreground) / <alpha-value>)',
          background: 'rgb(var(--info-background) / <alpha-value>)',
        },
        
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar) / <alpha-value>)',
          foreground: 'rgb(var(--sidebar-foreground) / <alpha-value>)',
          border: 'rgb(var(--sidebar-border) / <alpha-value>)',
          active: 'rgb(var(--sidebar-active) / <alpha-value>)',
          'active-foreground': 'rgb(var(--sidebar-active-foreground) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
