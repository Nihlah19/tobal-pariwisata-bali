/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
        daun: '#2F5D3A',
        lumut: '#6B8F5E',
        krem: '#F5EFE0',
        pasir: '#E8DCC2',
        tanah: '#7A5C3E',
        'tanah-gelap': '#3B2F24',
        padi: '#C9A227',
        laut: '#4F7C8A',
        teks: '#2B2B24',
      },
      fontFamily: {
        heading: ['"Playfair Display"', '"Fraunces"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', '"Nunito Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        organik: '0 4px 24px rgba(43, 43, 36, 0.08)',
        'organik-lg': '0 8px 40px rgba(43, 43, 36, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'leaf-fall': 'leafFall 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        leafFall: {
          '0%': { transform: 'translateY(-10%) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.7' },
          '90%': { opacity: '0.7' },
          '100%': { transform: 'translateY(110vh) rotate(360deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
