import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

export const metadata: Metadata = {
  title: "Bebidas ON - Sistema de Gestão",
  description: "Sistema completo de gestão para delivery de bebidas",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
body {
  background-color: #111827;
  color: #f9fafb;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}
        `}</style>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-900">{children}</div>
        </ErrorBoundary>
      </body>
    </html>
  )
}
