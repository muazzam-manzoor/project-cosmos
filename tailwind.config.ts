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
        cosmos: {
          bg: "#030712",
          panel: "rgba(6, 13, 28, 0.78)",
          border: "rgba(56, 189, 248, 0.22)",
          cyan: "#38bdf8",
          emerald: "#34d399",
          amber: "#fbbf24",
          violet: "#a78bfa",
          rose: "#fb7185",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
