import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest (App Router convention).
// Icons live in /public/icons and use the standard android-chrome naming.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AnglerPermit",
    short_name: "AnglerPermit",
    description:
      "AnglerPermit is a private license-assistance service for state fishing licenses.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0A2540",
    icons: [
      {
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
