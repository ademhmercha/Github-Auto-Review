/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        paper: '#efeadf',
        card: '#f7f3ea',
        ink: '#16140f',
        ember: '#ff4b1f',
        moss: '#2f7d4f',
        blood: '#c0301c',
        gold: '#c98a00',
      },
    },
  },
  plugins: [],
};
