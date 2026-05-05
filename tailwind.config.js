export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#FFFFFF",
        accent: "#F5F5F5",
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      borderRadius: {
        'kma': '0.75rem',
      },
      boxShadow: {
        'kma-card': '0 10px 40px -15px rgba(0, 0, 0, 0.1), 0 5px 15px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
