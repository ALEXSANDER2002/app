"use client"

import { useEffect, useState } from "react"
import { WifiOff, Wifi, RefreshCw } from "lucide-react"
import { syncManually, getPendingSyncCount } from "@/lib/db"
import { Button } from "@/components/ui/button"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Define o estado inicial
    setIsOnline(navigator.onLine)

    // Configura os listeners
    const handleOnline = () => {
      setIsOnline(true)
      checkPendingSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Verifica itens pendentes de sincronização
    checkPendingSync()

    // Configura um intervalo para verificar periodicamente
    const interval = setInterval(checkPendingSync, 60000) // A cada minuto

    // Configura listener para mensagens do service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_COMPLETED") {
          checkPendingSync()
        }
      })
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])

  const checkPendingSync = async () => {
    try {
      const count = await getPendingSyncCount()
      setPendingSync(count)
    } catch (error) {
      console.error("Erro ao verificar sincronizações pendentes:", error)
    }
  }

  const handleSync = async () => {
    if (!isOnline) return

    setIsSyncing(true)
    try {
      await syncManually()
      await checkPendingSync()
    } catch (error) {
      console.error("Erro ao sincronizar:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (isOnline && pendingSync === 0) {
    return null // Não mostra nada quando está online e não há pendências
  }

  return (
    <div
      className={`fixed bottom-16 left-0 right-0 z-50 transition-all duration-300 ${
        expanded ? "max-h-32" : "max-h-10"
      } ${isOnline ? "bg-blue-500" : "bg-yellow-500"}`}
    >
      <div
        className="py-2 px-4 text-center text-sm font-medium text-white cursor-pointer"
        onClick={() => pendingSync > 0 && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-center">
          {isOnline ? <Wifi className="mr-2 h-4 w-4" /> : <WifiOff className="mr-2 h-4 w-4" />}

          {isOnline
            ? pendingSync > 0
              ? `${pendingSync} ${pendingSync === 1 ? "item pendente" : "itens pendentes"} de sincronização`
              : "Conectado"
            : "Você está offline. Os dados serão sincronizados quando a conexão for restabelecida."}
        </div>
      </div>

      {expanded && pendingSync > 0 && isOnline && (
        <div className="px-4 pb-3 flex justify-center">
          <Button
            size="sm"
            className="bg-white text-blue-500 hover:bg-blue-50 h-10 px-4 font-medium"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar agora
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
