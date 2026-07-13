import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "Georgia", "Times New Roman", "serif"]
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        claret: "hsl(var(--claret))",
        ink: "hsl(var(--ink))",
        paper: "hsl(var(--paper))",
        aurora: {
          DEFAULT: "hsl(var(--aurora))",
          deep: "hsl(var(--aurora-deep))",
          glow: "hsl(var(--aurora-glow))"
        }
      },
      letterSpacing: {
        tightish: "-0.02em",
        tighter2: "-0.035em"
      },
      boxShadow: {
        "quiet-xl": "0 1px 0 hsl(34 16% 84%)",
        "blue-line": "0 0 0 1px hsl(34 16% 84%)"
      }
    }
  },
  plugins: []
};

export default config;
