const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './frontend/**/*.{html,js}',
    './frontend/src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1976d2',
          light: '#63a4ff',
          dark: '#004ba0',
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#1976d2',
          600: '#1565c0',
          700: '#0d47a1',
          800: '#0a2472',
          900: '#051b4c',
        },
        secondary: {
          DEFAULT: '#dc004e',
          light: '#ff5c8d',
          dark: '#a00037',
          50: '#fce4ec',
          100: '#f8bbd0',
          200: '#f48fb1',
          300: '#f06292',
          400: '#ec407a',
          500: '#dc004e',
          600: '#c2185b',
          700: '#ad1457',
          800: '#880e4f',
          900: '#5c0734',
        },
        success: {
          DEFAULT: '#4caf50',
          light: '#80e27e',
          dark: '#087f23',
        },
        warning: {
          DEFAULT: '#ff9800',
          light: '#ffc947',
          dark: '#c66900',
        },
        error: {
          DEFAULT: '#f44336',
          light: '#ff7961',
          dark: '#ba000d',
        },
        info: {
          DEFAULT: '#2196f3',
          light: '#6ec6ff',
          dark: '#0069c0',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['"SF Pro Display"', ...defaultTheme.fontFamily.sans],
        mono: ['"SF Mono"', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        '2xs': '0.625rem',
        '3xs': '0.5rem',
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
            maxWidth: '65ch',
            a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.primary.dark'),
              },
            },
            'h1, h2, h3, h4': {
              fontWeight: theme('fontWeight.bold'),
              fontFamily: theme('fontFamily.display').join(', '),
            },
          },
        },
      }),
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-xl': 'inset 0 4px 6px 0 rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/colors/themes')['[data-theme=light]'],
          primary: '#1976d2',
          secondary: '#dc004e',
          accent: '#ff9800',
          neutral: '#3d4451',
          'base-100': '#ffffff',
        },
        dark: {
          ...require('daisyui/src/colors/themes')['[data-theme=dark]'],
          primary: '#90caf9',
          secondary: '#f48fb1',
          accent: '#ffd54f',
          neutral: '#2a2e37',
          'base-100': '#1f2937',
        },
      },
    ],
  },
  variants: {
    extend: {
      backgroundColor: ['active', 'group-hover'],
      textColor: ['active', 'group-hover'],
      borderColor: ['active', 'group-hover'],
      opacity: ['disabled'],
      cursor: ['disabled'],
      ringColor: ['hover', 'active'],
      ringWidth: ['hover', 'active'],
      scale: ['group-hover'],
      transform: ['group-hover'],
    },
  },
};
