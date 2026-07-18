import type { Config } from "tailwindcss";

/**
 * AnglerPermit design tokens.
 * Palette: deep navy (primary), forest green (accent), white surfaces, slate text.
 * Professional and official-FEELING, but original — no government seals or branding.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A2540",
          50: "#F0F5FA",
          100: "#DCE7F2",
          200: "#B9CFE5",
          300: "#8AADD1",
          400: "#5B8BBD",
          500: "#38699E",
          600: "#265282",
          700: "#1A4067",
          800: "#122F4E",
          900: "#0A2540",
          950: "#061829",
        },
        forest: {
          DEFAULT: "#1B4332",
          50: "#F0F7F4",
          100: "#DCEBE4",
          200: "#B7D6C8",
          300: "#8ABAA5",
          400: "#5C9B81",
          500: "#2D6A4F",
          600: "#1B4332",
          700: "#16382A",
          800: "#122D22",
          900: "#0D221A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(10 37 64 / 0.05), 0 1px 3px 0 rgb(10 37 64 / 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
