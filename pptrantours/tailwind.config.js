/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Warm near-black, tinted toward the brand crimson rather than neutral
        // grey — used for the hero, footer and dark bands.
        ink: {
          DEFAULT: "#150a0d",
          800: "#1f1013",
          700: "#2c181c",
          600: "#3d2229",
        },
        // Primary: the crimson sampled from the PPP Tran Tours logo (#A80424).
        crimson: {
          50: "#fdf2f4",
          100: "#fbe3e8",
          200: "#f6c7d1",
          300: "#ed94a7",
          400: "#dd5172",
          500: "#c51a43",
          600: "#a80424",
          700: "#8d0520",
          800: "#74081f",
          900: "#600a1e",
        },
        // Accent: the lemon-gold from the logo's outline and lettering (#F1D72D).
        gold: {
          200: "#fbf4c2",
          300: "#f7e886",
          400: "#f1d72d",
          500: "#d8bd18",
          600: "#ab9412",
        },
        sand: "#fbf7f4",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      maxWidth: {
        shell: "84rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,10,13,.04), 0 12px 32px -12px rgba(21,10,13,.18)",
        lift: "0 2px 4px rgba(21,10,13,.05), 0 28px 56px -20px rgba(21,10,13,.32)",
        glow: "0 0 0 1px rgba(168,4,36,.25), 0 18px 44px -16px rgba(168,4,36,.5)",
      },
      backgroundImage: {
        "grain":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "slow-zoom": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.12)" },
        },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.22,1,.36,1) both",
        "fade-in": "fade-in .9s ease both",
        "slow-zoom": "slow-zoom 22s ease-out both",
      },
    },
  },
  plugins: [],
};
