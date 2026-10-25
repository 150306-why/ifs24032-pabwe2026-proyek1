/**
 * Tema Toba Tix: biru danau yang dalam, merah ulos Batak, dan emas sebagai aksen kecil.
 * Nama `lake` dan `pine` dipertahankan agar kelas lama tetap valid.
 */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        lake: {
          50: '#eef6f8', 100: '#d7eaef', 200: '#b0d5de', 300: '#82b9c6', 400: '#54989f',
          500: '#2f7b8f', 600: '#1f6176', 700: '#174d5f', 800: '#123e4d', 900: '#0c2f3b', 950: '#07222d',
        },
        ulos: {
          50: '#fdf1ef', 100: '#fadcd7', 200: '#f4b9b0', 500: '#d03a2c', 600: '#b8271f', 700: '#981f19', 800: '#7a1b17',
        },
        gold: { 100: '#f8ecd0', 300: '#ecc979', 400: '#e3b34f', 500: '#d09a2c', 600: '#a97a1d' },
        pine: {
          50: '#effaf3', 100: '#d8f3e1', 500: '#2fa564', 600: '#1f8a50', 700: '#1a6e42', 800: '#175937',
        },
        mist: '#f2f6f7',
        ink: '#14212b',
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Figtree', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 1px 2px rgb(12 47 59 / .06), 0 8px 24px -8px rgb(12 47 59 / .18)',
        pass: '0 2px 4px rgb(12 47 59 / .08), 0 18px 40px -18px rgb(12 47 59 / .35)',
      },
      keyframes: {
        rise: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        
        toast: { from: { opacity: 0, transform: 'translateY(12px) scale(.98)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        rise: 'rise .35s ease-out both',
        
        toast: 'toast .22s ease-out both',
      },
    },
  },
  plugins: [],
};
