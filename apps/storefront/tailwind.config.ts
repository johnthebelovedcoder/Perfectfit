import type { Config } from "tailwindcss";
import sharedConfig from "@thread/config/tailwind";
import animate from "tailwindcss-animate";

const config: Config = {
  ...sharedConfig,
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  plugins: [animate],
};

export default config;
