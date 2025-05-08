"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, FireExtinguisher, Droplets, AlertTriangle, Bell, Search, Calendar, Filter } from "lucide-react"
import { getInspecoes, getInspecoesByTipo } from "@/lib/db"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNav } from "@/components/bottom-nav"
import { OptimizedImage } from "@/components/optimized-image"
import { debounce, throttle } from "@/lib/performance-utils"
import type { Inspecao } from "@/lib/db"

export default function HistoricoPage() {
  const router = useRouter()
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([])
  const [filteredInspecoes, setFilteredInspecoes] = useState<Inspecao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState("todos")
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const itemsPerPage = 10

  // Carrega as inspeções do IndexedDB
  const loadInspecoes = useCallback(async () => {
    try {
      setIsLoading(true)
      let data: Inspecao[]

      if (tipoFiltro !== "todos") {
        data = await getInspecoesByTipo(tipoFiltro)
      } else {
        data = await getInspecoes()
      }

      setInspecoes(data)
      setPage(1) // Reset para a primeira página quando mudar o filtro
      setIsLoading(false)
    } catch (err) {
      console.error("Erro ao carregar inspeções:", err)
      setIsLoading(false)
    }
  }, [tipoFiltro])

  // Efeito para carregar inspeções quando o componente montar ou o filtro mudar
  useEffect(() => {
    // Verifica se o usuário está logado
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/")
      return
    }

    loadInspecoes()
  }, [router, loadInspecoes, tipoFiltro])

  // Filtra as inspeções com base no termo de busca
  const filterInspecoes = useCallback(() => {
    if (!searchTerm.trim()) {
      // Se não há termo de busca, mostra todas as inspeções (paginadas)
      const paginatedInspecoes = inspecoes.slice(0, page * itemsPerPage)
      setFilteredInspecoes(paginatedInspecoes)
      setHasMore(inspecoes.length > page * itemsPerPage)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = inspecoes.filter(
      (insp) => insp.local.toLowerCase().includes(term) || insp.observacoes.toLowerCase().includes(term),
    )

    setFilteredInspecoes(filtered.slice(0, page * itemsPerPage))
    setHasMore(filtered.length > page * itemsPerPage)
  }, [inspecoes, searchTerm, page])

  // Debounce para a busca
  const debouncedSearch = useMemo(() => debounce(() => filterInspecoes(), 300), [filterInspecoes])

  // Efeito para filtrar quando o termo de busca ou a página mudar
  useEffect(() => {
    if (searchTerm.trim()) {
      debouncedSearch()
    } else {
      filterInspecoes()
    }
  }, [searchTerm, page, debouncedSearch, filterInspecoes])

  // Função para carregar mais itens
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage((prevPage) => prevPage + 1)
    }
  }, [hasMore, isLoading])

  // Função para detectar quando o usuário chegou ao final da lista
  const handleScroll = useMemo(
    () =>
      throttle(() => {
        if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
          loadMore()
        }
      }, 200),
    [loadMore],
  )

  // Adiciona o evento de scroll
  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "extintores":
        return <FireExtinguisher className="h-5 w-5 text-red-500" />
      case "mangueiras":
        return <Droplets className="h-5 w-5 text-blue-500" />
      case "acidentes":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "alarmes":
        return <Bell className="h-5 w-5 text-purple-500" />
      default:
        return null
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "extintores":
        return "bg-red-100 text-red-700"
      case "mangueiras":
        return "bg-blue-100 text-blue-700"
      case "acidentes":
        return "bg-yellow-100 text-yellow-700"
      case "alarmes":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch (e) {
      return dateString
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      extintores: "Extintor",
      mangueiras: "Mangueira",
      acidentes: "Acidente",
      alarmes: "Alarme",
    }
    return labels[tipo] || tipo
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

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Histórico</h1>
              <p className="text-white/80">Inspeções registradas</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>

          <div className={`mb-4 space-y-3 overflow-hidden transition-all ${showFilters ? "max-h-40" : "max-h-0"}`}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por local ou observações..."
                className="h-10 rounded-lg border-0 bg-white/10 pl-9 text-white placeholder:text-white/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="h-10 rounded-lg border-0 bg-white/10 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="extintores">Extintores</SelectItem>
                <SelectItem value="mangueiras">Mangueiras</SelectItem>
                <SelectItem value="acidentes">Acidentes</SelectItem>
                <SelectItem value="alarmes">Alarmes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="mx-auto max-w-md">
          {isLoading && page === 1 ? (
            <div className="flex h-40 items-center justify-center rounded-lg bg-white p-8 text-center shadow">
              <div className="flex flex-col items-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
                <p className="text-slate-600">Carregando inspeções...</p>
              </div>
            </div>
          ) : filteredInspecoes.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-lg bg-white p-8 text-center shadow">
              <div className="flex flex-col items-center">
                <Search className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-slate-600">Nenhuma inspeção encontrada</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInspecoes.map((inspecao, index) => (
                <Card
                  key={`${inspecao.id}-${index}`}
                  className="overflow-hidden border-0 shadow-md transition-all hover:shadow-lg"
                >
                  <div className="grid grid-cols-[1fr_120px]">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${getTipoColor(inspecao.tipo)}`}
                        >
                          {getTipoIcon(inspecao.tipo)}
                          {getTipoLabel(inspecao.tipo)}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="flex items-center text-xs text-slate-500">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(inspecao.data)}
                        </span>
                      </div>

                      <h3 className="mb-1 text-lg font-bold">{inspecao.local}</h3>

                      {inspecao.observacoes && (
                        <p className="mb-2 line-clamp-2 text-sm text-slate-600">{inspecao.observacoes}</p>
                      )}

                      <div className="text-xs text-slate-500">Registrado por: {inspecao.usuario}</div>
                    </CardContent>

                    <div className="h-full">
                      <OptimizedImage
                        src={inspecao.foto || "/placeholder.svg"}
                        alt={`Foto da inspeção de ${inspecao.local}`}
                        className="h-full w-full"
                        lowQualitySrc={inspecao.foto} // Poderia ser uma versão de menor qualidade
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button variant="outline" onClick={loadMore} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800"></div>
                        Carregando...
                      </>
                    ) : (
                      "Carregar mais"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
