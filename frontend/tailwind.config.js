/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // --- THE NEW DESIGN PALETTE ---
      colors: {
        surface: {
          DEFAULT: "rgba(17, 24, 39, 0.6)", // Glass effect background
          hover: "rgba(31, 41, 55, 0.8)",
          border: "rgba(55, 65, 81, 0.5)",
        },
        brand: {
          primary: "#6366f1", // Indigo
          secondary: "#10b981", // Emerald
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
        "glass-hover": "0 8px 32px 0 rgba(99, 102, 241, 0.15)",
      },
      backdropBlur: {
        md: "12px",
      },
      // ------------------------------
      keyframes: {
        "drift-1": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(15vw, 10vh)" },
          "50%": { transform: "translate(5vw, 25vh)" },
          "75%": { transform: "translate(-15vw, 5vh)" },
        },
        "drift-2": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "33%": { transform: "translate(-20vw, -15vh)" },
          "66%": { transform: "translate(10vw, -25vh)" },
        },
        "drift-3": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(25vw, -10vh)" },
        },
      },
      animation: {
        "drift-slow": "drift-1 45s ease-in-out infinite",
        "drift-medium": "drift-2 35s ease-in-out infinite",
        "drift-fast": "drift-3 25s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
