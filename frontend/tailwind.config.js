/** @type {import('tailwindcss').Config} */
export default {
  // Scans these files for class names so Tailwind can tree-shake
  // unused utility classes out of the final production CSS bundle.
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Custom brand color palette for ReBorrow. Defined as an
      // extension (not a full override) so all default Tailwind
      // colors (gray, red, etc.) remain available alongside these —
      // we still need neutrals and semantic colors (red for 'reject',
      // green for 'approve') beyond just the brand palette.
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};