import type { Config } from "tailwindcss";
import bidayaxTailwindPreset from "@bidayax/config/tailwind";

export default {
  presets: [bidayaxTailwindPreset],
  content: [
    "./stories/**/*.{ts,tsx}",
    "../ui/src/**/*.{ts,tsx}",
    "./.storybook/**/*.{ts,tsx}"
  ]
} satisfies Config;
