/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#16a34a",
          light: "#d1fadf",
          dark: "#0f6a2d",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      },
      borderRadius: {
        xl: "1.25rem"
      }
    },
  },
  plugins: [],
};

