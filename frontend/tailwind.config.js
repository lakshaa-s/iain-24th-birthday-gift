/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: "#F4F2E4", deep: "#E7E3CE" },
        ink:   { DEFAULT: "#1A1A18", soft: "#6B675C" },
        tape:  "#E8873A",
        cut: {
          black: "#262523", orange: "#E8873A", grey: "#8C8C8C",
          paper: "#F9F7EE", wood: "#9A6B3F", pink: "#F0BBD0",
          yellow: "#F2D64B", teal: "#3E8E7E",
        },
      },
      fontFamily: {
        ui:    ["Jost", "Futura", "sans-serif"],
        type:  ['"Special Elite"', "Courier New", "monospace"],
        r1:    ["Anton", "Impact", "sans-serif"],
        r2:    ['"Abril Fatface"', "Georgia", "serif"],
        r3:    ["Rye", "Georgia", "serif"],
        r4:    ['"Special Elite"', "monospace"],
        r5:    ["Bungee", "Impact", "sans-serif"],
      },
      keyframes: {
        shelve: { from: { opacity: "0", transform: "translateY(30px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        drop:   { "0%": { opacity: "0", transform: "translateY(-14px) rotate(var(--tilt))" },
                  "70%": { transform: "translateY(3px) rotate(var(--tilt))" },
                  "100%": { opacity: "1", transform: "translateY(0) rotate(var(--tilt))" } },
        bob:    { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } },
        blink:  { "0%,94%,100%": { transform: "scaleY(1)" }, "97%": { transform: "scaleY(.1)" } },
        pageflip: { "0%,72%": { transform: "rotateY(0deg)" }, "88%,100%": { transform: "rotateY(-158deg)" } },
        steam:  { "0%": { opacity: "0", transform: "translateY(0) scale(.8)" },
                  "40%": { opacity: ".55" },
                  "100%": { opacity: "0", transform: "translateY(-16px) scale(1.25)" } },
      },
      animation: {
        shelve: "shelve .5s cubic-bezier(.2,.8,.3,1) both",
        drop: "drop .55s cubic-bezier(.2,.9,.3,1) both",
        bob: "bob 4.5s ease-in-out infinite",
        blink: "blink 5s ease-in-out infinite",
        pageflip: "pageflip 5s ease-in-out infinite",
        steam: "steam 3.2s ease-out infinite",
      },
    },
  },
  plugins: [],
}