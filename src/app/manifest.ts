import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Relapse Ledger",
    short_name: "Ledger",
    description: "A private habit recovery tracker.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f2eee3",
    theme_color: "#f2eee3",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
