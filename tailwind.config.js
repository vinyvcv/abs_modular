import {
  RADII,
  SHADOWS,
  SPACING,
  TAILWIND_COLORS,
  TYPOGRAPHY,
  Z_INDEX
} from './src/styles/designTokens.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: TAILWIND_COLORS,
      fontFamily: TYPOGRAPHY.fontFamilies,
      fontSize: TYPOGRAPHY.tailwindFontSize,
      /* Escala padronizada baseada em grid de 4px e 8px */
      spacing: SPACING.tailwindSpacing,
      borderRadius: RADII.tailwindRadii,
      boxShadow: SHADOWS.tailwindShadows,
      zIndex: Z_INDEX
    }
  },
  plugins: []
}
