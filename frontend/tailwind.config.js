/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        // מסלול שיוט 1: תנועה רחבה ימינה ולמטה, ואז חזרה שמאלה
        "drift-1": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(15vw, 10vh)" },
          "50%": { transform: "translate(5vw, 25vh)" },
          "75%": { transform: "translate(-15vw, 5vh)" },
        },
        // מסלול שיוט 2: תנועה שמאלה ולמעלה, ואז ימינה
        "drift-2": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "33%": { transform: "translate(-20vw, -15vh)" },
          "66%": { transform: "translate(10vw, -25vh)" },
        },
        // מסלול שיוט 3: תנועה אלכסונית ארוכה
        "drift-3": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(25vw, -10vh)" },
        },
      },
      animation: {
        // הארכנו משמעותית את הזמנים כדי שזה יהיה שיוט איטי ומרגיע
        "drift-slow": "drift-1 45s ease-in-out infinite",
        "drift-medium": "drift-2 35s ease-in-out infinite",
        "drift-fast": "drift-3 25s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
