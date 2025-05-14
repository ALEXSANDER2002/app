"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FireExtinguisher, Download, LogIn } from "lucide-react"
import { isPWAInstalled, showInstallPrompt, setupInstallPrompt } from "@/lib/pwa-utils"
import { InstallPWAButton } from "@/components/install-pwa-button"
import { InstallPWABanner } from "@/components/install-pwa-banner"
import Link from "next/link"

export default function LandingPage() {
  const router = useRouter()
  const [isInstalled, setIsInstalled] = useState(false)
  const [installable, setInstallable] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Verifica se o PWA já está instalado
    setIsInstalled(isPWAInstalled())

    // Configura o prompt de instalação
    setupInstallPrompt()

    // Verifica se o PWA pode ser instalado
    const checkInstallable = () => {
      setInstallable(Boolean((window as any).deferredPrompt))
    }

    checkInstallable()

    // Adiciona um listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = () => {
      checkInstallable()
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Adiciona listener para scroll
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [router])

  const handleInstall = async () => {
    await showInstallPrompt()
    setIsInstalled(isPWAInstalled())
  }

  const handleLogin = () => {
    router.push("/login") // Redireciona para a página de login
  }

  return (
    <div className="min-h-screen bg-white">
      <InstallPWABanner />

      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-30 bg-white px-4 md:px-0 shadow-sm"
        style={{
          padding: "1rem 0",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-red-700">
                <FireExtinguisher className="h-6 w-6 text-white" />
              </div>
              <h1 className="ml-2 text-xl font-bold text-slate-900">InspeFogo</h1>
            </div>
            <div className="flex items-center gap-2">
              {!isInstalled && installable && (
                <InstallPWAButton variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" />
              )}
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 text-slate-900 hover:bg-slate-100"
                  size="lg"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="font-medium">Entrar</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-800 pt-28 pb-20 text-white md:pt-36 md:pb-32">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            <div className="flex flex-col justify-center">
              <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                Inspeções contra incêndio simplificadas
              </h1>
              <p className="mb-8 text-base text-white/90 sm:text-lg md:text-xl">
                Registre, acompanhe e gerencie inspeções de segurança contra incêndio de forma eficiente, mesmo sem
                conexão com a internet.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row w-full">
                {!isInstalled && installable && (
                  <Button
                    onClick={handleInstall}
                    size="lg"
                    className="h-16 w-full bg-white text-red-600 hover:bg-white/90 hover:text-red-700 text-lg font-bold shadow-lg border-2 border-white"
                  >
                    <Download className="mr-2 h-6 w-6" />
                    Instalar aplicativo
                  </Button>
                )}
                <Button
                  onClick={handleLogin}
                  size="lg"
                  className="h-16 w-full bg-white text-red-600 hover:bg-white/90 text-lg font-bold shadow-lg border-2 border-white"
                >
                  <LogIn className="mr-2 h-6 w-6" />
                  {isInstalled ? "Acessar aplicativo" : "Continuar para login"}
                </Button>
              </div>
            </div>
            <div className="hidden md:flex md:items-center md:justify-center">
              <div className="relative">
                <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-red-500/20 blur-3xl"></div>
                <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl"></div>
                <div className="relative h-[600px] w-[300px] overflow-hidden rounded-xl border-8 border-white/10 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20"></div>
                  <div className="absolute inset-0 flex flex-col">
                    {/* Header mockup */}
                    <div className="bg-red-600 p-4 text-white">
                      <div className="mb-2 h-6 w-32 rounded bg-white/20"></div>
                      <div className="h-4 w-48 rounded bg-white/20"></div>
                    </div>

                    {/* Content mockup */}
                    <div className="flex-1 bg-white p-4">
                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="h-24 rounded-lg bg-red-100"></div>
                        <div className="h-24 rounded-lg bg-blue-100"></div>
                        <div className="h-24 rounded-lg bg-yellow-100"></div>
                        <div className="h-24 rounded-lg bg-purple-100"></div>
                      </div>
                      <div className="mb-3 h-6 w-3/4 rounded bg-slate-200"></div>
                      <div className="mb-6 h-4 w-full rounded bg-slate-100"></div>
                      <div className="h-10 rounded-lg bg-red-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 120"
            fill="white"
            preserveAspectRatio="none"
            className="h-[60px] w-full"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* PWA Installation Section */}
      <section className="bg-red-50 py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Como instalar o aplicativo
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col items-start rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-xl font-semibold">Instale diretamente</h3>
              <p className="mb-4 text-slate-600">
                Clique no botão "Instalar aplicativo" acima para adicionar o InspeFogo à tela inicial do seu
                dispositivo. Isso permitirá que você acesse o aplicativo mesmo sem conexão com a internet.
              </p>
              {installable && (
                <Button onClick={handleInstall} className="bg-red-600 text-white hover:bg-red-700">
                  <Download className="mr-2 h-5 w-5" /> Instalar agora
                </Button>
              )}
            </div>
            <div className="flex flex-col items-start rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-xl font-semibold">Instruções para iOS</h3>
              <p className="mb-4 text-slate-600">No iOS, você precisa usar o Safari e seguir estes passos:</p>
              <ol className="mb-4 list-decimal pl-5 text-slate-600">
                <li className="mb-2">Toque no botão de compartilhamento (ícone de caixa com seta)</li>
                <li className="mb-2">Role para baixo e toque em "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar" no canto superior direito</li>
              </ol>
              <Button
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
                onClick={() => {
                  alert(
                    "Para instalar no iOS:\n1. Toque no botão de compartilhamento ↑\n2. Role para baixo e toque em 'Adicionar à Tela de Início'\n3. Toque em 'Adicionar'",
                  )
                }}
              >
                Ver instruções detalhadas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-900 sm:text-3xl">Recursos do InspeFogo</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-md">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <FireExtinguisher className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Inspeções Offline</h3>
              <p className="text-slate-600">
                Realize inspeções mesmo sem conexão com a internet. Os dados são sincronizados automaticamente quando
                você volta a ficar online.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-md">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-blue-600"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Relatórios Detalhados</h3>
              <p className="text-slate-600">
                Gere relatórios completos com fotos, observações e histórico de inspeções para cada equipamento.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-md">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-green-600"
                >
                  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Fácil de Usar</h3>
              <p className="text-slate-600">
                Interface intuitiva e simples, projetada para facilitar o trabalho dos bombeiros e inspetores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            O que dizem nossos usuários
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center">
                <div className="mr-4 h-12 w-12 rounded-full bg-slate-200"></div>
                <div>
                  <h3 className="font-semibold">Carlos Silva</h3>
                  <p className="text-sm text-slate-500">Bombeiro Civil</p>
                </div>
              </div>
              <p className="text-slate-600">
                "O InspeFogo revolucionou a forma como realizamos inspeções. Agora consigo registrar tudo rapidamente e
                sem complicações, mesmo em locais sem sinal de internet."
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center">
                <div className="mr-4 h-12 w-12 rounded-full bg-slate-200"></div>
                <div>
                  <h3 className="font-semibold">Ana Oliveira</h3>
                  <p className="text-sm text-slate-500">Engenheira de Segurança</p>
                </div>
              </div>
              <p className="text-slate-600">
                "Os relatórios gerados pelo aplicativo são completos e profissionais. Economizo muito tempo e consigo
                manter um histórico organizado de todas as inspeções."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-16 text-white">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold">Comece a usar o InspeFogo hoje mesmo</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
            Simplifique suas inspeções contra incêndio com um aplicativo completo, rápido e que funciona offline.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {!isInstalled && installable ? (
              <Button
                onClick={handleInstall}
                size="lg"
                className="h-14 bg-white text-red-600 hover:bg-white/90 text-lg font-medium"
              >
                <Download className="mr-2 h-5 w-5" /> Instalar aplicativo
              </Button>
            ) : (
              <Button
                onClick={handleLogin}
                size="lg"
                className="h-14 bg-white text-red-600 hover:bg-white/90 text-lg font-medium"
              >
                <LogIn className="mr-2 h-5 w-5" /> Acessar aplicativo
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <FireExtinguisher className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="ml-3 text-2xl font-bold">InspeFogo</h2>
          </div>
          <div className="mb-8 text-center">
            <p className="text-slate-400">© {new Date().getFullYear()} InspeFogo. Todos os direitos reservados.</p>
          </div>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-slate-400 hover:text-white">
              Termos de Uso
            </a>
            <a href="#" className="text-slate-400 hover:text-white">
              Política de Privacidade
            </a>
            <a href="#" className="text-slate-400 hover:text-white">
              Contato
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
} 