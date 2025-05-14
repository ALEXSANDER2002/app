"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Trash2, Download, Upload, RefreshCw, LogOut } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { isPWAInstalled, registerServiceWorker, isPWASupported } from "@/lib/pwa-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isPWASupp, setIsPWASupp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dbSize, setDbSize] = useState<string>("Calculando...")
  const [isPreviewEnv, setIsPreviewEnv] = useState(false)

  useEffect(() => {
    // Verifica se o usuário está logado
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    setUser(JSON.parse(storedUser))

    // Verifica se o app está instalado
    setIsInstalled(isPWAInstalled())

    // Verifica se PWA é suportado
    setIsPWASupp(isPWASupported())

    // Verifica se estamos em ambiente de preview
    const isPreview =
      window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app")
    setIsPreviewEnv(isPreview)

    // Calcula o tamanho aproximado do banco de dados
    calculateDbSize()

    // Registra o service worker (com verificação de ambiente)
    registerServiceWorker()
  }, [router])

  const calculateDbSize = async () => {
    try {
      // Estimativa baseada no número de inspeções
      const dbName = "inspecoes-bombeiros"
      const request = indexedDB.open(dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(["inspecoes"], "readonly")
        const store = transaction.objectStore("inspecoes")
        const countRequest = store.count()

        countRequest.onsuccess = () => {
          const count = countRequest.result
          // Estimativa grosseira: cada inspeção ocupa aproximadamente 500KB (principalmente devido às fotos)
          const sizeInKB = count * 500

          if (sizeInKB < 1024) {
            setDbSize(`${sizeInKB.toFixed(1)} KB`)
          } else {
            setDbSize(`${(sizeInKB / 1024).toFixed(1)} MB`)
          }

          db.close()
        }
      }
    } catch (error) {
      console.error("Erro ao calcular tamanho do banco de dados:", error)
      setDbSize("Erro ao calcular")
    }
  }

  const handleLogout = () => {
    if (window.confirm("Tem certeza que deseja sair? Você precisará fazer login novamente.")) {
      localStorage.removeItem("user")
      router.push("/")
    }
  }

  const handleClearData = () => {
    if (window.confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.")) {
      setIsLoading(true)

      try {
        const dbName = "inspecoes-bombeiros"
        const request = indexedDB.deleteDatabase(dbName)

        request.onsuccess = () => {
          toast({
            title: "Dados limpos",
            description: "Todos os dados foram removidos com sucesso",
            variant: "success",
          })

          // Reinicia o aplicativo
          setTimeout(() => {
            window.location.href = "/"
          }, 1500)
        }

        request.onerror = () => {
          toast({
            title: "Erro",
            description: "Não foi possível limpar os dados",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Erro ao limpar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível limpar os dados",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }
  }

  const handleExportData = () => {
    setIsLoading(true)

    try {
      const dbName = "inspecoes-bombeiros"
      const request = indexedDB.open(dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(["inspecoes"], "readonly")
        const store = transaction.objectStore("inspecoes")
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = () => {
          const data = getAllRequest.result
          const dataStr = JSON.stringify(data, null, 2)
          const dataBlob = new Blob([dataStr], { type: "application/json" })
          const url = URL.createObjectURL(dataBlob)

          const a = document.createElement("a")
          a.href = url
          a.download = `fireinspect-backup-${new Date().toISOString().split("T")[0]}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          db.close()
          setIsLoading(false)

          toast({
            title: "Dados exportados",
            description: "Backup realizado com sucesso",
            variant: "success",
          })
        }

        getAllRequest.onerror = () => {
          toast({
            title: "Erro",
            description: "Não foi possível exportar os dados",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const refreshApp = () => {
    if (window.confirm("Deseja recarregar o aplicativo? Isso atualizará os recursos em cache.")) {
      // Força a atualização do cache do service worker
      if ("serviceWorker" in navigator && !isPreviewEnv) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.update()
          }
        })
      }

      // Recarrega a página
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-16">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white">
        <div className="mx-auto max-w-md">
          <Button
            variant="ghost"
            className="mb-2 text-white hover:bg-white/20 hover:text-white"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>

          <div className="mb-4">
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-white/80">Gerencie seu aplicativo</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="mx-auto max-w-md space-y-4">
          {isPreviewEnv && (
            <Alert className="mb-4 border-amber-200 bg-amber-100 text-amber-800">
              <AlertDescription>
                Você está em um ambiente de preview. Algumas funcionalidades como Service Worker e instalação de PWA não
                estão disponíveis.
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Informações do Aplicativo</CardTitle>
              <CardDescription>Detalhes sobre o InspeFogo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Versão</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Armazenamento</span>
                <span className="font-medium">{dbSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Instalado como PWA</span>
                <span className="font-medium">{isInstalled ? "Sim" : "Não"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">PWA Suportado</span>
                <span className="font-medium">{isPWASupp && !isPreviewEnv ? "Sim" : "Não"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Usuário</span>
                <span className="font-medium">{user?.username || "Desconhecido"}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={refreshApp}>
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar Aplicativo
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Dados e Armazenamento</CardTitle>
              <CardDescription>Gerencie seus dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sync">Sincronização Automática</Label>
                  <p className="text-xs text-slate-500">Sincronizar quando online</p>
                </div>
                <Switch id="sync" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compress">Compressão de Imagens</Label>
                  <p className="text-xs text-slate-500">Reduz o tamanho das fotos</p>
                </div>
                <Switch id="compress" defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button variant="outline" className="w-full" onClick={handleExportData} disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" /> Exportar Dados
              </Button>
              <Button variant="outline" className="w-full" disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" /> Importar Dados
              </Button>
              <Button variant="destructive" className="w-full" onClick={handleClearData} disabled={isLoading}>
                <Trash2 className="mr-2 h-4 w-4" /> Limpar Todos os Dados
              </Button>
            </CardFooter>
          </Card>

          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair da Conta
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
