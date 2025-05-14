import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="mb-6 text-6xl font-bold text-red-600">404</div>

      <h1 className="mb-2 text-2xl font-bold">Página não encontrada</h1>

      <p className="mb-6 max-w-md text-slate-600">
        Desculpe, a página que você está procurando não existe ou foi movida.
      </p>

      <Button asChild>
        <Link href="/" className="flex items-center justify-center">
          <Home className="mr-2 h-4 w-4" /> Voltar ao início
        </Link>
      </Button>
    </div>
  )
}
