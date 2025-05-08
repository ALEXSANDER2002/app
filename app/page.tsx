"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { initDB } from "@/lib/db"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Inicializa o banco de dados
    initDB().catch(console.error)

    // Verifica se o usuário já está logado
    const user = localStorage.getItem("user")
    if (user) {
      router.push("/dashboard")
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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-red-600 to-red-800 p-4">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
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
                  className="h-12 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-base font-medium shadow-md transition-all hover:from-red-700 hover:to-red-800"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col bg-slate-50 px-6 py-4">
            <p className="text-center text-xs text-slate-500">
              Este aplicativo funciona 100% offline após o primeiro carregamento.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
