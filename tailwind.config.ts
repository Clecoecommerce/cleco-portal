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
          DEFAULT: "#185FA5",
          700: "#134d85",
          900: "#0d3a68",
          50: "#EBF2FA",
          100: "#D6E5F4",
        },
        ink: {
          DEFAULT: "#0E1A2B",
          2: "#2B3A4F",
        },
        muted: {
          DEFAULT: "#6B7A8F",
          2: "#8E9BAE",
        },
        line: {
          DEFAULT: "#E4E8EE",
          2: "#EFF2F6",
        },
        bg: "#F6F8FB",
        surface: "#FFFFFF",
        amber: {
          DEFAULT: "#B7791F",
          bg: "#FBF3E1",
        },
        green: {
          DEFAULT: "#1F7A4D",
          bg: "#E5F4EC",
        },
        blue: {
          DEFAULT: "#1A5FA5",
          bg: "#E6EFF8",
        },
        red: { DEFAULT: "#B23B3B", bg: "#FBE9E9" },
      },
      boxShadow: {
        sm: "0 1px 2px rgba(14,26,43,.04), 0 1px 1px rgba(14,26,43,.03)",
        md: "0 4px 14px rgba(14,26,43,.06), 0 1px 3px rgba(14,26,43,.04)",
        lg: "0 24px 60px rgba(14,26,43,.18), 0 8px 18px rgba(14,26,43,.08)",
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
