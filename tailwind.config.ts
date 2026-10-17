import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { 0: "#0b0f14", 1: "#11161d", 2: "#1a222c", 3: "#232d3a" },
        fg: { 0: "#e5e7eb", 1: "#cbd5e1", 2: "#9ca3af", 3: "#64748b" },
        brand: { DEFAULT: "#6366f1", light: "#818cf8" },
        accent: "#a855f7",
        ok: "#10b981",
        warn: "#f59e0b",
        danger: "#ef4444",
        critical: "#d32f2f",
        info: "#38bdf8",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
