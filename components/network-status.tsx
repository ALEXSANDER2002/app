"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Define o estado inicial
    setIsOnline(navigator.onLine)

    // Configura os listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline) {
    return null // Não mostra nada quando está online
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 bg-yellow-500 py-2 text-center text-sm font-medium text-white">
      <div className="flex items-center justify-center">
        <WifiOff className="mr-2 h-4 w-4" />
        Você está offline. Os dados serão sincronizados quando a conexão for restabelecida.
      </div>
    </div>
  )
}
