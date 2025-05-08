"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Registra o erro no console para depuração
    console.error("Erro na aplicação:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-10 w-10 text-red-600" />
      </div>

      <h1 className="mb-2 text-2xl font-bold">Ops! Algo deu errado</h1>

      <p className="mb-6 max-w-md text-slate-600">
        Desculpe, encontramos um problema ao processar sua solicitação. Isso pode ser um erro temporário.
      </p>

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
        <Button onClick={() => reset()} className="flex items-center justify-center">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>

        <Button variant="outline" onClick={() => router.push("/")} className="flex items-center justify-center">
          <Home className="mr-2 h-4 w-4" /> Voltar ao início
        </Button>
      </div>

      {error.message && process.env.NODE_ENV === "development" && (
        <div className="mt-8 max-w-md rounded-lg bg-slate-100 p-4 text-left text-xs text-slate-700">
          <p className="font-mono">{error.message}</p>
        </div>
      )}
    </div>
  )
}
