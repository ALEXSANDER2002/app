import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "InspeFogo - Inspeções Contra Incêndio",
    short_name: "InspeFogo",
    description: "Sistema para registro de inspeções de segurança contra incêndio",
    start_url: "/landing",
    display: "standalone",
    background_color: "#ef4444",
    theme_color: "#ef4444",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/login.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/screenshots/dashboard.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
    shortcuts: [
      {
        name: "Nova Inspeção",
        short_name: "Nova",
        description: "Iniciar uma nova inspeção",
        url: "/inspecao/extintores",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Histórico",
        short_name: "Histórico",
        description: "Ver histórico de inspeções",
        url: "/historico",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
