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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};