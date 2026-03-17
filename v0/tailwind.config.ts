import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        'livetrip': {
          primary: '#1a6b4a',
          'primary-dark': '#0f4a32',
          secondary: '#e8f5ee',
          accent: '#f5a623',
          background: '#f6f4f0',
          surface: '#ffffff',
        }
      },
      borderRadius: {
        'card': '12px',
        'input': '10px',
      },
      boxShadow: {
        'subtle': '0 2px 16px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
