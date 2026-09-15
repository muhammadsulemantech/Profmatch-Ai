import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-heading)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#3157A4",
          foreground: "#ffffff",
          50: "#f4f7fc",
          100: "#e8eff9",
          200: "#c7d8f1",
          500: "#3157A4",
          600: "#264687",
          700: "#1D3667",
        },
        academic: {
          DEFAULT: "#3157A4",
          hover: "#264687",
          light: "#EEF2F9",
          dark: "#1D3667",
        },
        sage: {
          DEFAULT: "#5C8F86",
          hover: "#4A766F",
          light: "#F0F5F4",
          dark: "#3A5C57",
        },
        ivory: {
          DEFAULT: "#F8F7F3",
          subtle: "#F1F2EE",
          dark: "#EAE9E4",
        },
        navy: {
          DEFAULT: "#172033",
          subtle: "#242D3D",
          muted: "#525C6F",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        academic: "0 1px 3px 0 rgba(23, 32, 51, 0.04), 0 1px 2px -1px rgba(23, 32, 51, 0.03)",
        "academic-md": "0 4px 6px -1px rgba(23, 32, 51, 0.05), 0 2px 4px -2px rgba(23, 32, 51, 0.04)",
        "academic-lg": "0 10px 15px -3px rgba(23, 32, 51, 0.06), 0 4px 6px -4px rgba(23, 32, 51, 0.03)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
