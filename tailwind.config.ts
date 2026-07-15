import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0B0B0B",
          panel: "#18181B",
          orange: "#F74E14",
          soft: "#F4F4F5"
        }
      },
      borderRadius: {
        xl: "0.75rem"
      }
    }
  },
  plugins: []
};

export default config;
