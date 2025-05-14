"use client"

import { useEffect, useState } from "react"
import { Database, HardDrive } from "lucide-react"
import { checkStorageSpace } from "@/lib/pwa-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export function OfflineBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [firstVisit, setFirstVisit] = useState(false)
  const [storageInfo, setStorageInfo] = useState<{
    available: boolean
    quota?: number
    usage?: number
  }>({ available: true })

  useEffect(() => {
    // Verifica se é a primeira visita
    const visited = localStorage.getItem("app-visited")
    if (!visited) {
      setFirstVisit(true)
      localStorage.setItem("app-visited", "true")
    }

    // Verifica o espaço de armazenamento
    checkStorageSpace().then(setStorageInfo)

    // Mostra o banner apenas na primeira visita ou se o armazenamento estiver baixo
    setShowBanner(firstVisit || !storageInfo.available)

    // Esconde o banner após 10 segundos
    const timer = setTimeout(() => {
      setShowBanner(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [firstVisit, storageInfo.available])

  if (!showBanner) return null

  // Calcula a porcentagem de uso do armazenamento
  const storagePercentage =
    storageInfo.quota && storageInfo.usage ? Math.round((storageInfo.usage / storageInfo.quota) * 100) : 0

  // Formata o tamanho em MB
  const formatStorage = (bytes?: number) => {
    if (!bytes) return "Desconhecido"
    return `${Math.round(bytes / (1024 * 1024))} MB`
  }

  return (
    <Alert className="fixed top-4 left-4 right-4 z-50 border-blue-200 bg-blue-50 text-blue-800 shadow-lg">
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">
          {firstVisit ? (
            <Database className="h-5 w-5 text-blue-500" />
          ) : (
            <HardDrive className="h-5 w-5 text-amber-500" />
          )}
        </div>
        <div className="flex-1">
          <AlertTitle>{firstVisit ? "Aplicativo disponível offline" : "Espaço de armazenamento baixo"}</AlertTitle>
          <AlertDescription className="mt-1">
            {firstVisit ? (
              "Este aplicativo funciona mesmo sem internet. Seus dados são armazenados localmente e serão sincronizados quando você estiver online."
            ) : (
              <>
                <p className="mb-2">
                  Seu dispositivo está com pouco espaço disponível. Isso pode afetar o funcionamento do aplicativo.
                </p>
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-xs">
                    <span>Uso: {formatStorage(storageInfo.usage)}</span>
                    <span>Total: {formatStorage(storageInfo.quota)}</span>
                  </div>
                  <Progress value={storagePercentage} className="h-2" />
                </div>
              </>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}
