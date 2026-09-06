import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",   // Primary
          700: "#1d4ed8",   // Primary Dark
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#0f172a",
        },
        accent: {
          50:  "#fff7ed",  // Orange Soft
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",  // Orange
          600: "#ea580c",
          700: "#c2410c",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle:  "#f8fafc",
          muted:   "#f1f5f9",
          border:  "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      maxWidth: {
        page: "1400px",
        content: "900px",
        card: "480px",
      },
      spacing: {
        "sidebar": "256px",
        "header":  "64px",
      },
      boxShadow: {
        "card":       "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-hover": "0 8px 24px 0 rgb(0 0 0 / 0.10)",
        "blue":       "0 4px 14px 0 rgb(37 99 235 / 0.25)",
        "orange":     "0 4px 14px 0 rgb(249 115 22 / 0.25)",
      },
      borderRadius: {
        "xl":  "14px",
        "2xl": "18px",
        "3xl": "24px",
      },
      animation: {
        "fade-in":      "fade-in 300ms ease both",
        "fade-in-up":   "fade-in-up 400ms ease both",
        "slide-left":   "slide-in-left 300ms ease both",
        "pulse-soft":   "pulse-soft 2s ease-in-out infinite",
        "shimmer":      "shimmer 1.5s infinite",
        "spin-slow":    "spin 3s linear infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
