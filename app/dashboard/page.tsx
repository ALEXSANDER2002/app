"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FireExtinguisher, Droplets, AlertTriangle, Bell, History, LogOut, User, Plus } from "lucide-react"
import { checkServiceWorkerStatus } from "@/lib/pwa-utils"
import { BottomNav } from "@/components/bottom-nav"
import { getInspecoes } from "@/lib/db"
import { adjustPerformanceSettings } from "@/lib/performance-utils"

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [swStatus, setSwStatus] = useState("")
  const [recentInspecoes, setRecentInspecoes] = useState<number>(0)
  const [performanceSettings, setPerformanceSettings] = useState<{
    imageQuality: number
    animationsEnabled: boolean
    cacheStrategy: "aggressive" | "balanced" | "minimal"
  } | null>(null)

  // Carrega as inspeções recentes
  const loadRecentInspecoes = useCallback(async () => {
    try {
      const inspecoes = await getInspecoes()
      // Conta inspeções das últimas 24 horas
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const recent = inspecoes.filter((insp) => new Date(insp.timestamp) > oneDayAgo).length

      setRecentInspecoes(recent)
    } catch (error) {
      console.error("Erro ao carregar inspeções recentes:", error)
    }
  }, [])

  useEffect(() => {
    // Verifica se o usuário está logado
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    setUser(JSON.parse(storedUser))

    // Monitora o status de conexão
    const handleOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnlineStatus)
    window.addEventListener("offline", handleOnlineStatus)

    // Verifica o status do service worker
    checkServiceWorkerStatus().then(setSwStatus)

    // Carrega inspeções recentes
    loadRecentInspecoes()

    // Ajusta configurações de performance
    adjustPerformanceSettings().then((settings) => {
      setPerformanceSettings(settings)

      // Aplica configurações de animação
      if (!settings.animationsEnabled) {
        document.documentElement.classList.add("reduce-motion")
      }
    })

    return () => {
      window.removeEventListener("online", handleOnlineStatus)
      window.removeEventListener("offline", handleOnlineStatus)
    }
  }, [router, loadRecentInspecoes])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const inspectionTypes = [
    {
      title: "Extintores",
      icon: <FireExtinguisher className="h-10 w-10 text-white" />,
      path: "/inspecao/extintores",
      bgColor: "bg-gradient-to-br from-red-500 to-red-600",
    },
    {
      title: "Mangueiras",
      icon: <Droplets className="h-10 w-10 text-white" />,
      path: "/inspecao/mangueiras",
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Acidentes",
      icon: <AlertTriangle className="h-10 w-10 text-white" />,
      path: "/inspecao/acidentes",
      bgColor: "bg-gradient-to-br from-yellow-500 to-yellow-600",
    },
    {
      title: "Alarmes",
      icon: <Bell className="h-10 w-10 text-white" />,
      path: "/inspecao/alarmes",
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
  ]

  const isPWAInstalled = () => {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore
      (window.navigator as any).standalone === true
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex-1 p-4 pb-20">
        <div className="mx-auto max-w-md">
          <header className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-yellow-500"}`}
                  ></div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">Olá, {user.username}</h1>
                    {isPWAInstalled() && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        PWA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="flex items-center">
                      {isOnline ? (
                        <span className="flex items-center">
                          <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <span className="mr-1 h-2 w-2 rounded-full bg-yellow-500"></span>
                          Offline
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-12 w-12 rounded-full"
                aria-label="Sair da conta"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            <Card className="overflow-hidden border-0 bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h2 className="text-lg font-medium">Nova Inspeção</h2>
                    <p className="text-sm text-white/80">Registre uma nova inspeção de segurança</p>
                  </div>
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                    onClick={() => router.push(inspectionTypes[0].path)}
                    aria-label="Criar nova inspeção"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </header>

          {recentInspecoes > 0 && (
            <div className="mb-6">
              <div className="rounded-lg bg-green-50 p-3 text-green-800">
                <p className="text-sm">
                  <span className="font-medium">{recentInspecoes}</span>{" "}
                  {recentInspecoes === 1 ? "inspeção realizada" : "inspeções realizadas"} nas últimas 24 horas
                </p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Tipos de Inspeção</h2>
            <div className="grid grid-cols-2 gap-4">
              {inspectionTypes.map((type) => (
                <Card
                  key={type.title}
                  className={`cursor-pointer overflow-hidden border-0 shadow-md ${performanceSettings?.animationsEnabled ? "transition-transform hover:scale-105" : ""}`}
                  onClick={() => router.push(type.path)}
                >
                  <CardContent className={`flex flex-col items-center p-6 ${type.bgColor}`}>
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                      {type.icon}
                    </div>
                    <h3 className="text-center font-medium text-white">{type.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Button
            className="w-full rounded-lg bg-slate-800 py-6 text-base hover:bg-slate-900 h-14 font-medium"
            onClick={() => router.push("/historico")}
          >
            <History className="mr-2 h-5 w-5" /> Ver Histórico de Inspeções
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
