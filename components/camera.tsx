"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw, CameraIcon as FlipCamera, X } from "lucide-react"
import {
  getCameraStream,
  stopCameraStream,
  capturePhoto,
  compressBase64Image,
  type CameraFacing,
} from "@/lib/camera-utils"

interface CameraComponentProps {
  onCapture: (photoData: string) => void
  onClose: () => void
  aspectRatio?: number
}

export function CameraComponent({ onCapture, onClose, aspectRatio = 4 / 3 }: CameraComponentProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>("environment")
  const [hasFrontCamera, setHasFrontCamera] = useState(false)
  const [hasBackCamera, setHasBackCamera] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Inicializa a câmera
  const initCamera = async (facing: CameraFacing = "environment") => {
    setIsLoading(true)
    setError(null)

    try {
      // Para o stream atual se existir
      if (stream) {
        stopCameraStream(stream)
      }

      // Obtém o novo stream
      const newStream = await getCameraStream({
        facing,
        aspectRatio,
      })

      // Atualiza o estado e conecta ao elemento de vídeo
      setStream(newStream)
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }

      setCameraFacing(facing)
    } catch (err) {
      console.error("Erro ao inicializar câmera:", err)

      // Verifica se é um erro de permissão negada
      if (err instanceof Error && err.message.includes("permissão")) {
        setPermissionDenied(true)
      }

      setError(err instanceof Error ? err.message : "Erro desconhecido ao acessar a câmera")
    } finally {
      setIsLoading(false)
    }
  }

  // Verifica as câmeras disponíveis
  const checkAvailableCameras = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return
    }

    try {
      // Solicita permissão primeiro para poder enumerar os dispositivos com rótulos
      await navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((tempStream) => {
          // Para o stream temporário imediatamente após obter permissão
          tempStream.getTracks().forEach((track) => track.stop())
        })
        .catch((err) => {
          console.error("Erro ao solicitar permissão de câmera:", err)
          if (err.name === "NotAllowedError") {
            setPermissionDenied(true)
          }
        })

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")

      // Verifica se temos câmeras traseiras e frontais
      const hasBack = videoDevices.some(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("traseira") ||
          device.label.toLowerCase().includes("rear"),
      )

      const hasFront = videoDevices.some(
        (device) =>
          device.label.toLowerCase().includes("front") ||
          device.label.toLowerCase().includes("frontal") ||
          device.label.toLowerCase().includes("user"),
      )

      // Se temos identificação clara, use-a
      if (hasBack) setHasBackCamera(true)
      if (hasFront) setHasFrontCamera(true)

      // Se não conseguimos identificar claramente, mas temos múltiplas câmeras
      if (!hasBack && !hasFront && videoDevices.length > 1) {
        setHasBackCamera(true)
        setHasFrontCamera(true)
      } else if (!hasBack && !hasFront && videoDevices.length === 1) {
        // Se só temos uma câmera, assumimos que é a frontal
        setHasFrontCamera(true)
      }
    } catch (err) {
      console.error("Erro ao enumerar dispositivos:", err)
    }
  }

  // Alterna entre câmera frontal e traseira
  const toggleCamera = () => {
    const newFacing = cameraFacing === "environment" ? "user" : "environment"
    initCamera(newFacing)
  }

  // Captura a foto
  const handleCapture = async () => {
    if (!videoRef.current) return

    try {
      // Captura a foto do vídeo
      const photoData = capturePhoto(videoRef.current)

      // Comprime a imagem para economizar espaço
      const compressedPhoto = await compressBase64Image(photoData, 300 * 1024) // 300KB

      // Chama o callback com a foto comprimida
      onCapture(compressedPhoto)
    } catch (err) {
      console.error("Erro ao capturar foto:", err)
      setError("Erro ao capturar foto. Tente novamente.")
    }
  }

  // Tenta novamente inicializar a câmera
  const handleRetry = () => {
    setPermissionDenied(false)
    setError(null)
    checkAvailableCameras()
    initCamera()
  }

  // Inicializa a câmera quando o componente é montado
  useEffect(() => {
    checkAvailableCameras()
    initCamera()

    // Limpa recursos quando o componente é desmontado
    return () => {
      stopCameraStream(stream)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between bg-black p-4">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>

        {hasFrontCamera && hasBackCamera && (
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={toggleCamera}
            disabled={isLoading}
          >
            <FlipCamera className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Visualização da câmera */}
      <div className="relative flex-1 bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-8 w-8 animate-spin text-white" />
              <p className="mt-2 text-white">Iniciando câmera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
            <div className="flex flex-col items-center text-center">
              <Camera className="mb-4 h-12 w-12 text-red-500" />
              <p className="mb-4 text-white">{error}</p>
              {permissionDenied ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-white/80">
                    Você precisa permitir o acesso à câmera nas configurações do seu navegador ou dispositivo.
                  </p>
                  <Button onClick={onClose}>Voltar</Button>
                </div>
              ) : (
                <Button onClick={handleRetry}>Tentar novamente</Button>
              )}
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`h-full w-full object-cover ${isLoading || error ? "opacity-0" : "opacity-100"}`}
          onCanPlay={() => setIsLoading(false)}
        />

        {/* Guias de enquadramento */}
        {!isLoading && !error && (
          <div className="pointer-events-none absolute inset-0 border-[3px] border-white/30 m-8 rounded-lg"></div>
        )}
      </div>

      {/* Controles da câmera */}
      <div className="flex items-center justify-center bg-black p-6">
        <Button
          type="button"
          size="icon"
          className="h-16 w-16 rounded-full bg-white"
          onClick={handleCapture}
          disabled={isLoading || !!error}
        >
          <div className="h-14 w-14 rounded-full border-4 border-red-600"></div>
        </Button>
      </div>
    </div>
  )
}
