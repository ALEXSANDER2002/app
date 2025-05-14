"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { isPWAInstalled, showInstallPrompt } from "@/lib/pwa-utils"

interface InstallPWAButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  fullWidth?: boolean
}

export function InstallPWAButton({
  variant = "default",
  size = "default",
  className = "",
  fullWidth = false,
}: InstallPWAButtonProps) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verifica se o PWA já está instalado
    setIsInstalled(isPWAInstalled())

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
      setShowBanner(true)
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

  if (isInstalled) {
    return null
  }

  return (
    <>
      {/* Botão de instalação */}
      <Button
        variant={variant}
        size={size}
        className={`${className} ${fullWidth ? "w-full" : ""}`}
        onClick={handleInstall}
        disabled={!isInstallable}
      >
        <Download className="mr-2 h-4 w-4" />
        Instalar aplicativo
      </Button>

      {/* Banner de instalação */}
      {showBanner && isInstallable && (
        <div className="fixed bottom-16 left-4 right-4 z-50 rounded-lg bg-red-600 p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">Instale o InspeFogo para usar offline!</p>
              <p className="text-sm text-white/80">Acesse mesmo sem internet e tenha uma experiência melhor</p>
            </div>
            <div className="ml-4 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white bg-white/10 text-white hover:bg-white/20"
                onClick={handleInstall}
              >
                <Download className="mr-2 h-4 w-4" />
                Instalar
              </Button>
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
      )}
    </>
  )
}
