/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#061A2C',
        secondary: '#D96A23',
        surface: '#FFFFFF',
        background: '#F5F6F7',
        outline: '#AEB4BA',
        success: '#2E7D32',
        warning: '#F9A825',
        error: '#B3261E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.1)',
        'elevated': '0 4px 12px rgba(0,0,0,0.15)',
      }
    }
  },
  plugins: [],
}
