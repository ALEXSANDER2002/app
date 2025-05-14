"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Camera, Check, RotateCcw, Save, Loader2 } from "lucide-react"
import { addInspecao } from "@/lib/db"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BottomNav } from "@/components/bottom-nav"
import { CameraComponent } from "@/components/camera"
import { useToast } from "@/hooks/use-toast"

export default function InspecaoPage() {
  const router = useRouter()
  const { tipo } = useParams() as { tipo: string }
  const { toast } = useToast()

  const [local, setLocal] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [data, setData] = useState("")
  const [foto, setFoto] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [formTouched, setFormTouched] = useState(false)

  const tipoInfo = {
    extintores: {
      titulo: "Extintores",
      cor: "from-red-500 to-red-600",
      icone: (
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
          className="h-6 w-6"
        >
          <path d="M9.5 14.5 3 21" />
          <path d="M9.5 9.5 3 3" />
          <path d="M21 21a9 9 0 0 0-18 0" />
          <path d="M21 3a9 9 0 0 0-18 0" />
          <path d="M7 21a6 6 0 0 0 12 0" />
          <path d="M7 3a6 6 0 0 1 12 0" />
          <path d="M12 16a1 1 0 0 0 1-1v-6a1 1 0 0 0-2 0v6a1 1 0 0 0 1 1Z" />
        </svg>
      ),
    },
    mangueiras: {
      titulo: "Mangueiras",
      cor: "from-blue-500 to-blue-600",
      icone: (
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
          className="h-6 w-6"
        >
          <path d="M7 16.3c2.2 0 4-1.8 4-4.3 0-1.2-.5-2.3-1.3-3C9 8.3 7.7 7.5 7 7c-2 0-4 1.8-4 4.3 0 2.6 1.8 5 4 5Z" />
          <path d="M4.3 7H4a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4h.3" />
          <path d="M20 15.3c2.2 0 4-1.8 4-4.3 0-1.2-.5-2.3-1.3-3-1-1-2-1.7-2.7-2-2 0-4 1.8-4 4.3 0 2.6 1.8 5 4 5Z" />
          <path d="M17.3 7H20a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4h-2.7" />
          <path d="M11 13.5a4 4 0 0 0 8 0v-3a4 4 0 0 0-8 0Z" />
        </svg>
      ),
    },
    acidentes: {
      titulo: "Acidentes",
      cor: "from-yellow-500 to-yellow-600",
      icone: (
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
          className="h-6 w-6"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      ),
    },
    alarmes: {
      titulo: "Alarmes",
      cor: "from-purple-500 to-purple-600",
      icone: (
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
          className="h-6 w-6"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      ),
    },
  }[tipo] || { titulo: "Inspeção", cor: "from-slate-500 to-slate-600", icone: <div /> }

  useEffect(() => {
    // Define a data atual como padrão
    const today = new Date().toISOString().split("T")[0]
    setData(today)

    // Verifica se o usuário está logado
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/")
    }

    // Confirma antes de sair da página se o formulário foi modificado
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formTouched && !success) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [router, formTouched, success])

  // Marca o formulário como modificado quando qualquer campo é alterado
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value)
    setFormTouched(true)
  }

  const resetPhoto = () => {
    setFoto(null)
    setFormTouched(true)
  }

  const handleCapture = (photoData: string) => {
    setFoto(photoData)
    setShowCamera(false)
    setFormTouched(true)
  }

  const validateForm = (): boolean => {
    if (!local.trim()) {
      setError("O local da inspeção é obrigatório")
      return false
    }

    if (!foto) {
      setError("É necessário tirar uma foto")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")

      // Adiciona a inspeção ao banco de dados
      await addInspecao({
        tipo,
        local: local.trim(),
        data,
        observacoes: observacoes.trim(),
        foto: foto as string,
        timestamp: new Date().toISOString(),
        usuario: user.username || "Usuário",
      })

      setSuccess(true)
      setFormTouched(false)

      toast({
        title: "Inspeção registrada",
        description: "Os dados foram salvos com sucesso",
        variant: "success",
      })

      // Redireciona após 1.5 segundos
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (err) {
      console.error("Erro ao salvar inspeção:", err)
      setError("Ocorreu um erro ao salvar a inspeção. Tente novamente.")

      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a inspeção. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Confirmação antes de sair da página
  const handleBack = () => {
    if (formTouched && !success) {
      if (window.confirm("Você tem alterações não salvas. Deseja realmente sair?")) {
        router.push("/dashboard")
      }
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <>
      {showCamera ? (
        <CameraComponent onCapture={handleCapture} onClose={() => setShowCamera(false)} aspectRatio={4 / 3} />
      ) : (
        <div className="flex min-h-screen flex-col bg-slate-50 pb-16">
          <div className={`bg-gradient-to-r ${tipoInfo.cor} p-4 text-white`}>
            <div className="mx-auto max-w-md">
              <Button
                variant="ghost"
                className="mb-2 text-white hover:bg-white/20 hover:text-white"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  {tipoInfo.icone}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Nova Inspeção</h1>
                  <p className="text-white/80">{tipoInfo.titulo}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4">
            <div className="mx-auto max-w-md">
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardContent className="p-6">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="mb-4 border-green-200 bg-green-100 text-green-800">
                      <Check className="h-4 w-4" />
                      <AlertDescription>Inspeção registrada com sucesso!</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="local" className="text-sm font-medium">
                        Local da Inspeção *
                      </Label>
                      <Input
                        id="local"
                        value={local}
                        onChange={(e) => handleInputChange(setLocal, e.target.value)}
                        placeholder="Ex: Bloco A, 2º andar"
                        required
                        className="h-12 rounded-lg border-slate-200 bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data" className="text-sm font-medium">
                        Data da Inspeção
                      </Label>
                      <Input
                        id="data"
                        type="date"
                        value={data}
                        onChange={(e) => handleInputChange(setData, e.target.value)}
                        className="h-12 rounded-lg border-slate-200 bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoes" className="text-sm font-medium">
                        Observações
                      </Label>
                      <Textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => handleInputChange(setObservacoes, e.target.value)}
                        placeholder="Descreva detalhes relevantes sobre a inspeção..."
                        rows={4}
                        className="min-h-[120px] resize-none rounded-lg border-slate-200 bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Foto da Inspeção *</Label>
                      {foto ? (
                        <div className="relative overflow-hidden rounded-lg border border-slate-200">
                          <img
                            src={foto || "/placeholder.svg"}
                            alt="Foto da inspeção"
                            className="aspect-video w-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm"
                            onClick={resetPhoto}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-32 w-full flex-col gap-2 rounded-lg border-dashed border-slate-300 bg-slate-50"
                          onClick={() => setShowCamera(true)}
                        >
                          <Camera className="h-6 w-6 text-slate-400" />
                          <span className="text-slate-500">Tirar Foto</span>
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>

                <CardFooter className="flex justify-end border-t bg-slate-50 p-4">
                  <Button
                    className={`flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r ${tipoInfo.cor} text-white text-base font-medium transition-all hover:opacity-90`}
                    onClick={handleSubmit}
                    disabled={isSaving || success}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" /> Salvar Inspeção
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          <BottomNav />
        </div>
      )}
    </>
  )
}
