import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        accent: "#fca311",
        navy: "#092a5a",
        page: "#f4f7fb",
      },
      fontFamily: {
        sans: ["var(--font-bricolage-grotesque)", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px rgba(27, 65, 112, .08)",
      },
      backgroundImage: {
        sidebar: "linear-gradient(180deg, #092a5a 0%, #062044 100%)",
        hero: "linear-gradient(90deg, rgba(4, 48, 101, .96), rgba(11, 83, 147, .72)), radial-gradient(circle at 75% 30%, #55b4dd 0 12%, transparent 13%), linear-gradient(135deg, #1675b7 0%, #6cc5e9 48%, #0b427d 100%)",
        scanner: "linear-gradient(rgba(7, 37, 78, .62), rgba(7, 37, 78, .62)), linear-gradient(135deg, #83b9dc, #2e6a99)",
      },
    },
  },
  plugins: [],
};

export default config;
