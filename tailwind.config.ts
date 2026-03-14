import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#2D3A31",
        sage: "#8C9A84",
        clay: "#DCCFC2",
        alabaster: "#F9F8F4",
        stone: "#E6E2DA",
        terracotta: "#C27B66",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-source-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        botanical: "0 20px 40px -10px rgba(45, 58, 49, 0.08)",
        "botanical-lg": "0 30px 60px -15px rgba(45, 58, 49, 0.12)",
        "botanical-xl": "0 40px 80px -20px rgba(45, 58, 49, 0.16)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      transitionDuration: {
        "600": "600ms",
        "700": "700ms",
      },
    },
  },
  plugins: [],
};

export default config;
