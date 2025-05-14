"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X, Info } from "lucide-react"
import { isPWAInstalled, showInstallPrompt, isPWASupported } from "@/lib/pwa-utils"

export function InstallPWABanner() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Verifica se o PWA já está instalado
    setIsInstalled(isPWAInstalled())

    // Verifica se o PWA é suportado
    setIsSupported(isPWASupported())

    // Verifica se é iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)

    // Verifica se o PWA pode ser instalado
    const checkInstallable = () => {
      setIsInstallable(Boolean((window as any).deferredPrompt))
    }

    checkInstallable()

    // Adiciona um listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = () => {
      checkInstallable()
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Verifica se devemos mostrar o banner (se não estiver instalado e não foi dispensado recentemente)
    const bannerDismissed = localStorage.getItem("install-banner-dismissed")
    const dismissedTime = bannerDismissed ? Number.parseInt(bannerDismissed) : 0
    const showBannerAgain = Date.now() - dismissedTime > 24 * 60 * 60 * 1000 // 24 horas

    if (!isInstalled && showBannerAgain) {
      // Mostra o banner após 3 segundos para não interromper o carregamento inicial
      setTimeout(() => {
        setShowBanner(true)
      }, 3000)
    }

    // Limpa o listener quando o componente é desmontado
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    const installed = await showInstallPrompt()
    if (installed) {
      setIsInstalled(true)
      setShowBanner(false)
    }
  }

  const dismissBanner = () => {
    setShowBanner(false)
    localStorage.setItem("install-banner-dismissed", Date.now().toString())
  }

  if (isInstalled || !showBanner) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 p-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Info className="mr-2 h-5 w-5" />
          <div>
            {isInstallable ? (
              <p className="font-medium">Instale o InspeFogo para usar offline!</p>
            ) : isIOS ? (
              <p className="font-medium">Adicione à tela inicial para usar offline!</p>
            ) : !isSupported ? (
              <p className="font-medium">Este navegador não suporta instalação de PWA</p>
            ) : (
              <p className="font-medium">O InspeFogo funciona offline!</p>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2">
          {isInstallable ? (
            <Button
              size="sm"
              variant="outline"
              className="border-white bg-white/10 text-white hover:bg-white/20"
              onClick={handleInstall}
            >
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
          ) : isIOS ? (
            <Button
              size="sm"
              variant="outline"
              className="border-white bg-white/10 text-white hover:bg-white/20"
              onClick={() => {
                alert(
                  "Para instalar no iOS:\n1. Toque no botão de compartilhamento ↑\n2. Role para baixo e toque em 'Adicionar à Tela de Início'\n3. Toque em 'Adicionar'",
                )
                dismissBanner()
              }}
            >
              Como instalar
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
            onClick={dismissBanner}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
