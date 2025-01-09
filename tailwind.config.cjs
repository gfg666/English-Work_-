/** @type {import('tailwindcss').Config} */
function generateSpacing() {
  const spacing = {};
  for (let i = 1; i <= 400; i++) {
    spacing[i * 0.25] = `${i * 0.25 * 0.25}rem`; // 假设1rem = 16px
  }
  return spacing;
}

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      ping: ['PingFangSC-Regular, PingFang SC'],
      pingm: ['PingFangSC-Medium, PingFang SC'],
      pingb: ['PingFangSC-Semibold, PingFang SC'],
    },
    fontSize: {
      xss: '0.5rem',
      xs: '.625rem',
      sm: '0.75rem',
      tiny: '0.875rem',
      base: '1rem',
      bigger: '1.125rem',
      lg: '1.25rem',
      xl: '1.375rem',
      '2xl': '1.5rem',
      '3xl': '1.625rem',
      '4xl': '1.75rem',
      '5xl': '1.875rem',
      '6xl': '2rem',
      '7xl': '2.125rem',
    },
    extend: {
      spacing: generateSpacing(),
      height: {
        'account-chart': '10.6rem',
      },
      minHeight: {
        '40': '10rem',
        'card': '17.875rem'
      },
      lineHeight: {
        '12.5': '3.125rem',
      },
      fontFamily: {
        'norm': 'PingFangSC-Regular, PingFang SC;',
        'med': 'PingFangSC-Medium, PingFang SC;',
        'bold': 'PingFangSC-Semibold, PingFang SC;',
      },
      borderRadius: {
        'smh': '0.1875rem'
      },
      boxShadow: {
        default: '0px 0px 8px 0px rgba(0,0,0,0.08)',
      },
      zIndex: {
        '-1': '-1',
      },
      colors: {
        primary: '#6D49FF',
        'true-dark': '#000000',
        'light-dark': '#333333',
        'title-dark': '#393E45',
        'gray': '#999999',
        'des-gray': '#8C8C8C',
        'dark': '#666666',
        'title': '#181818',
        'dark-title': '#1B1B1B',
        'tag-blue': '#1C4FAD',
        'tag-black': '#373737',
        'tag-green': '#3BAE2B',
        'tag-red': '#F34039',
        'tag-gray': '#888888',
        'index-red': '#FF0000',
        'index-orange': '#FF5400',
        'index-yellow': '#FFB700',
        'gray-header': '#F0F2F5',
        'gray-border': '#EDEDED',
        'gray-button': '#FAFAFA',
        'gray-source': '#979797',
      },
      backgroundColor: (theme) => ({
        ...theme('colors'),
        'layout-gray': '#F5F6F8',
        'white': '#FFFFFF',
        'topic-preview': '#D7ECFF',
      }),
      backgroundImage: {
      },
      gridTemplateColumns: {
        // Simple 20 column grid
        '20': 'repeat(20, minmax(0, 1fr))',
      },
      screens: {
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1400px',
        '2xl': '1600px',
      },
    },
  }
}
