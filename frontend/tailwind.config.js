/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cloth:  { DEFAULT: "#1C3A31", deep: "#142822", light: "#274B40" },
        card:   { DEFAULT: "#E8E0CC", edge: "#CFC3A4" },
        ink:    { DEFAULT: "#2A2620", soft: "#6A6154" },
        gilt:   "#C9A227",
        stamp:  "#6D4482",
      },
      fontFamily: {
        display: ['"Libre Caslon Display"', "Georgia", "serif"],
        text:    ['"Libre Caslon Text"', "Georgia", "serif"],
        typed:   ['"Courier Prime"', '"Courier New"', "monospace"],
      },
      keyframes: {
        deal: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { deal: "deal .45s cubic-bezier(.2,.7,.3,1) both" },
    },
  },
  plugins: [],
}