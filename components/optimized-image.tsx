"use client"

import { useEffect, useRef, useState } from "react"
import { isLowPerformanceDevice } from "@/lib/performance-utils"

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  lowQualitySrc?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  lowQualitySrc,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [actualSrc, setActualSrc] = useState<string | null>(null)
  const lowPerformance = isLowPerformanceDevice()

  useEffect(() => {
    if (!imgRef.current) return

    // Determina qual fonte usar
    const sourceToUse = lowPerformance && lowQualitySrc ? lowQualitySrc : src

    // Se for prioritário, carrega imediatamente
    if (priority) {
      setActualSrc(sourceToUse)
      return
    }

    // Configura o observador de interseção para lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActualSrc(sourceToUse)
            observer.disconnect()
          }
        })
      },
      { rootMargin: "200px" }, // Pré-carrega quando a imagem estiver a 200px de entrar na viewport
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [src, lowQualitySrc, priority, lowPerformance])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
    onError?.()
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: width ? `${width}px` : "auto", height: height ? `${height}px` : "auto" }}
    >
      {/* Placeholder ou imagem de erro */}
      {(!isLoaded || error) && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-slate-100 ${
            error ? "text-red-500" : "text-slate-400"
          }`}
        >
          {error ? (
            <span className="text-xs">Erro ao carregar</span>
          ) : (
            <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200"></div>
          )}
        </div>
      )}

      {/* Imagem real */}
      <img
        ref={imgRef}
        src={actualSrc || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} // Imagem transparente de 1x1 pixel
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded && !error ? "opacity-100" : "opacity-0"
        }`}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  )
}
