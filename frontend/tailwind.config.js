/** Tema danau (biru) dan pegunungan (hijau). */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        lake: { 50: '#eff8ff', 100: '#dbeefe', 200: '#bfe0fd', 500: '#2b8be0', 600: '#1a6fc0', 700: '#155a9c', 800: '#14497c', 900: '#133d66' },
        pine: { 50: '#effaf3', 100: '#d8f3e1', 500: '#2fa564', 600: '#1f8a50', 700: '#1a6e42', 800: '#175937' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
