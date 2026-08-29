import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Connect Hub - Discipleship Ministry",
    short_name: "ConnectHub",
    description: "Streamline first timers, follow-up discipleship, and ministry management.",
    start_url: "/",
    display: "standalone",
    background_color: "#090D16",
    theme_color: "#EA580C",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}