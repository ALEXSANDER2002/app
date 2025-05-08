import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "InspeFogo - Inspeções Contra Incêndio",
  description: "Sistema para registro de inspeções de segurança contra incêndio",
  manifest: "/manifest.json",
  themeColor: "#ef4444",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "InspeFogo",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>

        {/* Script para registrar o Service Worker com verificação de ambiente */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              // Check if we're in a preview environment
              const isPreviewEnvironment = window.location.hostname.includes('vusercontent.net') || 
                                          window.location.hostname.includes('vercel.app');
              
              if (!isPreviewEnvironment) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('Service Worker registrado com sucesso:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('Falha ao registrar Service Worker:', error);
                    });
                });
              } else {
                console.log('Service Worker não disponível no ambiente de preview');
              }
            }
          `}
        </Script>

        {/* Script para detectar modo offline */}
        <Script id="offline-detection" strategy="afterInteractive">
          {`
            function updateOnlineStatus() {
              const statusIndicator = document.getElementById('network-status');
              if (statusIndicator) {
                if (navigator.onLine) {
                  statusIndicator.classList.remove('offline');
                  statusIndicator.classList.add('online');
                } else {
                  statusIndicator.classList.remove('online');
                  statusIndicator.classList.add('offline');
                }
              }
            }

            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
            
            // Executa na inicialização
            if (typeof window !== 'undefined') {
              window.addEventListener('load', updateOnlineStatus);
            }
          `}
        </Script>
      </body>
    </html>
  )
}
