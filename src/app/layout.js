import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://menu-bunker.vercel.app'),
  title: {
    default: 'Búnker Restaurant + La Victoriana — Menú digital',
    template: '%s · Búnker',
  },
  description:
    'Menú digital de Búnker Restaurant y La Victoriana Bodegón. Mira nuestros platos, bebidas y productos disponibles.',
  applicationName: 'Búnker + La Victoriana',
  authors: [{ name: 'Búnker Restaurant' }],
  keywords: [
    'Búnker Restaurant',
    'La Victoriana Bodegón',
    'menú digital',
    'restaurante Venezuela',
    'bodegón',
    'parrilla',
    'cortes al carbón',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    siteName: 'Búnker + La Victoriana',
    title: 'Búnker Restaurant + La Victoriana — Menú digital',
    description:
      'Menú digital de Búnker Restaurant y La Victoriana Bodegón. Mira nuestros platos, bebidas y productos disponibles.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Búnker Restaurant + La Victoriana',
    description:
      'Menú digital de Búnker Restaurant y La Victoriana Bodegón.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport = {
  themeColor: '#C8302E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
