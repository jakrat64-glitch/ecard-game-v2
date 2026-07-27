import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emperor: {
          DEFAULT: "#facc15",
          dark: "#a16207",
        },
        slave: {
          DEFAULT: "#e0263a",
          dark: "#8f0f1e",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
