import type { Config } from "tailwindcss";
import bidayaxTailwindPreset from "@bidayax/config/tailwind";

export default {
  presets: [bidayaxTailwindPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ]
} satisfies Config;
