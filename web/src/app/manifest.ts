import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SkinTwin",
    short_name: "SkinTwin",
    description: "See what worked for people with skin like yours, measured by scans.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF4F7",
    theme_color: "#8A3F66",
    orientation: "portrait",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512m", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Weekly check-in", url: "/scan" },
      { name: "My journal", url: "/journal" },
      { name: "My plan", url: "/routine" },
    ],
  };
}
