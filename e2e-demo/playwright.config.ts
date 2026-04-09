import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.DEMO_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
    video: {
      mode: "on",
      size: { width: 1280, height: 720 },
    },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    locale: "en",
  },
});
