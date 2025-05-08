"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, ClipboardList, Settings } from "lucide-react"
import { useState, useEffect } from "react"
import { isOnline } from "@/lib/pwa-utils"
import { NetworkStatus } from "@/components/network-status"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [networkStatus, setNetworkStatus] = useState(isOnline())

  useEffect(() => {
    // Monitora o status da conexão
    const handleOnlineStatus = () => {
      setNetworkStatus(isOnline())
    }

    window.addEventListener("online", handleOnlineStatus)
    window.addEventListener("offline", handleOnlineStatus)

    return () => {
      window.removeEventListener("online", handleOnlineStatus)
      window.removeEventListener("offline", handleOnlineStatus)
    }
  }, [])

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true
    }
    if (path === "/historico" && pathname === "/historico") {
      return true
    }
    if (path === "/inspecao" && pathname.startsWith("/inspecao")) {
      return true
    }
    if (path === "/configuracoes" && pathname === "/configuracoes") {
      return true
    }
    return false
  }

  return (
    <>
      <NetworkStatus />

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white shadow-lg">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <button
            className={`flex flex-1 flex-col items-center py-3 transition-colors ${
              isActive("/dashboard") ? "text-red-600" : "text-slate-500"
            }`}
            onClick={() => router.push("/dashboard")}
          >
            <Home className="mb-1 h-5 w-5" />
            <span className="text-xs">Início</span>
          </button>

          <button
            className={`flex flex-1 flex-col items-center py-3 transition-colors ${
              isActive("/historico") ? "text-red-600" : "text-slate-500"
            }`}
            onClick={() => router.push("/historico")}
          >
            <ClipboardList className="mb-1 h-5 w-5" />
            <span className="text-xs">Histórico</span>
          </button>

          <button
            className={`flex flex-1 flex-col items-center py-3 transition-colors ${
              isActive("/configuracoes") ? "text-red-600" : "text-slate-500"
            }`}
            onClick={() => router.push("/configuracoes")}
          >
            <Settings className="mb-1 h-5 w-5" />
            <span className="text-xs">Config</span>
          </button>
        </div>
      </div>
    </>
  )
}
