import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Hanken_Grotesk, Newsreader } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cleco · Portal de Clientes",
  description: "Gestiona tus facturas en cobranza y revisa el estado de tus recuperos.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={`${interTight.variable} ${jetbrainsMono.variable} ${hankenGrotesk.variable} ${newsreader.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
