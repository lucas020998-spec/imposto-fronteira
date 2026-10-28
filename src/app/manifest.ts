import type { MetadataRoute } from "next";

// Permite "Adicionar à tela inicial" no celular: abre em tela cheia, com ícone próprio.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Imposto Fronteira PB",
    short_name: "Fronteira PB",
    description: "Simulador do ICMS de fronteira para compras interestaduais com destino à Paraíba.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#0f766e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
