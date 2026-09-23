import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sabi",
    short_name: "Sabi",
    description: "Know what's known about the road ahead, and how sure we are.",
    start_url: "/",
    display: "standalone",
    background_color: "#1b1815",
    theme_color: "#1b1815",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
