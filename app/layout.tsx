import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vambe · Panel de Métricas de Clientes",
  description: "Categorización automática y métricas de reuniones de ventas de Vambe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Iconify web component, used as <iconify-icon icon="lucide:name" /> across the UI */}
        <script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js" async />
      </head>
      <body>{children}</body>
    </html>
  );
}
