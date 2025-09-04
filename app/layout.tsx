import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/hooks/use-theme"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "BRUCK - Profesionalizamos Pymes | Consultoría Tecnológica Avanzada",
    template: "%s | BRUCK",
  },
  description:
    "Transformamos la forma de trabajar de las pymes con tecnología de vanguardia. Especialistas en IA, automatización, análisis de datos y transformación digital.",
  keywords: [
    "consultoría tecnológica",
    "pymes",
    "inteligencia artificial",
    "automatización",
    "análisis datos",
    "transformación digital",
    "Argentina",
    "machine learning",
    "optimización procesos",
    "dashboards",
    "control financiero",
  ],
  authors: [{ name: "BRUCK", url: "https://somosbruck.com" }],
  creator: "BRUCK",
  publisher: "BRUCK",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://somosbruck.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BRUCK - Tecnología Avanzada para Pymes",
    description:
      "Revolucionamos pymes con IA, automatización y análisis de datos. El futuro de tu empresa comienza aquí.",
    type: "website",
    locale: "es_AR",
    url: "https://somosbruck.com",
    siteName: "BRUCK",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BRUCK - Profesionalizamos Pymes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BRUCK - Profesionalizamos Pymes",
    description: "Transformamos pymes con tecnología avanzada y procesos optimizados.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#31AE79" },
    { media: "(prefers-color-scheme: dark)", color: "#31AE79" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider defaultTheme="dark" storageKey="bruck-ui-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
