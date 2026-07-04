import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.purrdict.cat",
  appName: "Purrdict",
  webDir: "out",
  server: {
    androidScheme: "https",
    url: "https://purrdict.vercel.app",
  },
};

export default config;
