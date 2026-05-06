import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Tight", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        navy: {
          DEFAULT: "#2563EB",
          700: "#1d4ed8",
          900: "#1e3a5f",
          50:  "#EFF6FF",
          100: "#DBEAFE",
        },
        ink: {
          DEFAULT: "#0F172A",
          2: "#1E293B",
        },
        muted: {
          DEFAULT: "#6B7280",
          2: "#9CA3AF",
        },
        line: {
          DEFAULT: "#E2E8F0",
          2: "#F1F5F9",
        },
        bg:      "#EFF6FF",
        surface: "#FFFFFF",
        amber: {
          DEFAULT: "#B7791F",
          bg:      "#FBF3E1",
        },
        green: {
          DEFAULT: "#1F7A4D",
          bg:      "#E5F4EC",
        },
        blue: {
          DEFAULT: "#2563EB",
          bg:      "#EFF6FF",
        },
        red: { DEFAULT: "#B23B3B", bg: "#FBE9E9" },
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15,23,42,.04), 0 1px 1px rgba(15,23,42,.03)",
        md: "0 4px 14px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.04)",
        lg: "0 24px 60px rgba(15,23,42,.18), 0 8px 18px rgba(15,23,42,.08)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
