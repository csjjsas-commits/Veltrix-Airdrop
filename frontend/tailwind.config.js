export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blackVoid: '#050505',
          deepBlue: '#08111E',
          graphite: '#1A1F29',
          neonCyan: '#00CFFF',
          electricBlue: '#008CFF',
          elitePurple: '#784DFF',
          pureWhite: '#FFFFFF',
          softGray: '#C7CED8'
        }
      },
      boxShadow: {
        'brand-soft': '0 18px 60px rgba(0, 207, 255, 0.08)',
        'brand-glow': '0 0 0 1px rgba(0, 207, 255, 0.12), 0 20px 52px rgba(0, 207, 255, 0.12)'
      },
      backgroundImage: {
        'brand-fog': 'radial-gradient(circle at top, rgba(0, 207, 255, 0.12), transparent 25%), radial-gradient(circle at 80% 15%, rgba(120, 77, 255, 0.08), transparent 18%)'
      }
    }
  },
  plugins: []
};
