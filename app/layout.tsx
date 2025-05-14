import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"
import { OfflineBanner } from "@/components/offline-banner"
import Script from "next/script"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

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
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#dc2626" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <OfflineBanner />
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
              
              // Verifica atualizações
              registration.addEventListener('updatefound', function() {
                if (registration.installing) {
                  const newWorker = registration.installing;
                  
                  newWorker.addEventListener('statechange', function() {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      console.log('Nova versão disponível!');
                      
                      // Notifica o usuário sobre a atualização
                      if (!document.getElementById('update-notification')) {
                        const notification = document.createElement('div');
                        notification.id = 'update-notification';
                        notification.className = 'fixed bottom-20 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex justify-between items-center';
                        notification.innerHTML = \`
                          <div>Nova versão disponível! Atualize para obter as últimas melhorias.</div>
                          <button id="update-now" class="bg-white text-blue-600 px-3 py-1 rounded ml-2">Atualizar</button>
                        \`;
                        
                        document.body.appendChild(notification);
                        
                        document.getElementById('update-now').addEventListener('click', function() {
                          newWorker.postMessage({ type: 'SKIP_WAITING' });
                          notification.remove();
                          window.location.reload();
                        });
                      }
                    }
                  });
                }
              });
              
              // Pré-carrega recursos importantes para funcionamento offline
              if (registration.active) {
                const criticalResources = [
                  '/',
                  '/landing',
                  '/dashboard',
                  '/historico',
                  '/configuracoes',
                  '/inspecao/extintores',
                  '/inspecao/mangueiras',
                  '/inspecao/acidentes',
                  '/inspecao/alarmes',
                  '/icons/icon-192x192.png',
                  '/icons/icon-512x512.png'
                ];
                
                // Força o cache de recursos críticos
                criticalResources.forEach(function(url) {
                  fetch(url).catch(function(error) {
                    console.log('Pré-carregamento falhou para:', url, error);
                  });
                });
              }
            })
            .catch(function(error) {
              console.log('Falha ao registrar Service Worker:', error);
            });
        });
        
        // Recarrega a página quando o service worker é atualizado
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      } else {
        console.log('Service Worker não disponível no ambiente de preview');
        
        // Adiciona um banner informando que o app não pode ser instalado no ambiente de preview
        window.addEventListener('load', function() {
          setTimeout(function() {
            const banner = document.createElement('div');
            banner.className = 'fixed top-0 left-0 right-0 bg-yellow-600 text-white p-4 z-50 flex justify-between items-center';
            banner.innerHTML = \`
              <div>Você está em um ambiente de preview. Para instalar o aplicativo, acesse-o em um ambiente de produção.</div>
              <button id="dismiss-preview-banner" class="ml-2 text-white">&times;</button>
            \`;
            
            document.body.appendChild(banner);
            
            document.getElementById('dismiss-preview-banner').addEventListener('click', function() {
              banner.remove();
            });
          }, 3000);
        });
      }
    }
    
    // Adiciona um listener para o evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', function(e) {
      // Previne o comportamento padrão
      e.preventDefault();
      
      // Armazena o evento para uso posterior
      window.deferredPrompt = e;
      
      // Dispara um evento customizado para notificar componentes
      window.dispatchEvent(new CustomEvent('pwaInstallable', { detail: true }));
      
      // Mostra um banner de instalação na parte superior da página
      if (!document.getElementById('pwa-install-banner')) {
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50 flex justify-between items-center';
        banner.innerHTML = \`
          <div>Instale o InspeFogo para usar offline!</div>
          <button id="install-from-banner" class="bg-white text-red-600 px-3 py-1 rounded ml-2">Instalar</button>
          <button id="close-banner" class="ml-2 text-white">&times;</button>
        \`;
        
        document.body.appendChild(banner);
        
        document.getElementById('install-from-banner').addEventListener('click', function() {
          const promptEvent = window.deferredPrompt;
          if (promptEvent) {
            promptEvent.prompt();
            promptEvent.userChoice.then(function(choiceResult) {
              if (choiceResult.outcome === 'accepted') {
                console.log('Usuário aceitou a instalação');
                localStorage.setItem('pwa-installed', 'true');
              }
              window.deferredPrompt = null;
            });
          }
        });
        
        document.getElementById('close-banner').addEventListener('click', function() {
          banner.remove();
          localStorage.setItem('install-banner-dismissed', Date.now().toString());
        });
      }
    });
    
    // Limpa o prompt quando o PWA é instalado
    window.addEventListener('appinstalled', function() {
      window.deferredPrompt = null;
      
      // Remove o banner de instalação
      const banner = document.getElementById('pwa-install-banner');
      if (banner) {
        banner.remove();
      }
      
      // Registra que o app foi instalado
      localStorage.setItem('pwa-installed', 'true');
      
      // Mostra uma mensagem de sucesso
      alert('InspeFogo foi instalado com sucesso! Agora você pode usá-lo offline.');
    });
  `}
        </Script>

        {/* Script para detectar modo offline e pré-carregar recursos */}
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
              
              // Atualiza o status no localStorage para que outras páginas saibam
              localStorage.setItem('app-online-status', navigator.onLine ? 'online' : 'offline');
            }

            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
            
            // Executa na inicialização
            if (typeof window !== 'undefined') {
              window.addEventListener('load', function() {
                updateOnlineStatus();
                
                // Pré-carrega recursos importantes
                if ('serviceWorker' in navigator && navigator.onLine) {
                  const criticalResources = [
                    '/dashboard',
                    '/historico',
                    '/inspecao/extintores',
                    '/icons/icon-192x192.png',
                    '/icons/icon-512x512.png'
                  ];
                  
                  criticalResources.forEach(function(url) {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = url;
                    document.head.appendChild(link);
                  });
                }
              });
            }
          `}
        </Script>

        <Script id="pwa-install" strategy="afterInteractive">
          {`
            // Verifica se o PWA já está instalado
            if (window.matchMedia('(display-mode: standalone)').matches) {
              document.documentElement.classList.add('pwa-installed')
            }

            // Configura o prompt de instalação
            let deferredPrompt
            window.addEventListener('beforeinstallprompt', (e) => {
              e.preventDefault()
              deferredPrompt = e
              document.documentElement.classList.add('pwa-installable')
            })

            window.addEventListener('appinstalled', () => {
              document.documentElement.classList.add('pwa-installed')
              document.documentElement.classList.remove('pwa-installable')
            })
          `}
        </Script>
      </body>
    </html>
  )
}
