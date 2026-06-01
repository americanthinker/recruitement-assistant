import type { Config } from "tailwindcss";

// Tailwind CSS configuration for the Recruitment Assistant frontend.
// Extended by @frontend.eng in Epic 3 with shadcn/ui theme tokens and custom colors.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // TODO (@frontend.eng): Add shadcn/ui theme tokens and score badge color palette.
      // Score badge colors (SAD Section 6.3 / PRD Section 6):
      //   green:  score >= 85
      //   blue:   score 70-84
      //   yellow: score 55-69
      //   orange: score 30-54
      //   red:    score < 30
    },
  },
  plugins: [],
};

export default config;
