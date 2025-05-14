"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { initDB } from "@/lib/db"
import { AlertCircle, ArrowLeft, FireExtinguisher, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InstallPWAButton } from "@/components/install-pwa-button"
import { InstallPWABanner } from "@/components/install-pwa-banner"
import { isPWAInstalled, showInstallPrompt } from "@/lib/pwa-utils"
import Link from "next/link"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Inicializa o banco de dados
    initDB().catch(console.error)

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
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!username || !password) {
      setError("Preencha todos os campos")
      setIsLoading(false)
      return
    }

    // Simulação de login simples
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify({ username }))
      setIsLoading(false)
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-red-600 to-red-800 p-4 relative">
      <InstallPWABanner />

      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 hover:text-white h-12 w-12 rounded-full flex items-center justify-center"
            aria-label="Voltar para a página inicial"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center pt-16 sm:pt-10">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
            <FireExtinguisher className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">InspeFogo</h1>
          <p className="text-white/80">Sistema de Inspeções Contra Incêndio</p>
        </div>

        <Card className="w-full max-w-md overflow-hidden rounded-xl border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 pb-6 pt-6">
            <CardTitle className="text-center text-2xl font-bold text-white">Acesso ao Sistema</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-8">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin}>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Nome de usuário
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu nome de usuário"
                    autoCapitalize="none"
                    autoComplete="username"
                    autoCorrect="off"
                    disabled={isLoading}
                    className="h-12 rounded-lg border-slate-200 bg-slate-50 px-4 text-base"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="h-12 rounded-lg border-slate-200 bg-slate-50 px-4 text-base"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-14 rounded-lg bg-white text-red-600 border-2 border-red-600 text-base font-medium shadow-md transition-all hover:bg-white/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>

                {!isInstalled && isInstallable && (
                  <InstallPWAButton
                    variant="outline"
                    className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    fullWidth
                  />
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col bg-slate-50 px-6 py-4">
            <p className="text-center text-xs text-slate-500 mb-2">
              Este aplicativo funciona 100% offline após o primeiro carregamento.
            </p>
            <p className="text-center text-xs text-slate-500">
              <Download className="inline h-3 w-3 mr-1" />
              Instale como aplicativo para melhor experiência
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Botão flutuante de instalação */}
      {!isInstalled && isInstallable && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => showInstallPrompt()}
            className="h-14 w-14 rounded-full bg-red-600 shadow-lg hover:bg-red-700"
            size="icon"
          >
            <Download className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  )
} 