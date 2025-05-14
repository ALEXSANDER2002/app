// Tipos de câmera disponíveis
export type CameraFacing = "user" | "environment"

// Interface para as configurações da câmera
export interface CameraOptions {
  facing?: CameraFacing
  width?: number
  height?: number
  aspectRatio?: number
}

// Verifica se o dispositivo tem suporte a câmera
export const hasGetUserMedia = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// Verifica se o dispositivo tem câmera traseira
export const hasBackCamera = async (): Promise<boolean> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return false
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some((device) => device.kind === "videoinput" && device.label.toLowerCase().includes("back"))
  } catch (error) {
    console.error("Erro ao verificar câmeras:", error)
    return false
  }
}

// Obtém o stream da câmera com as opções especificadas
export const getCameraStream = async (options: CameraOptions = {}): Promise<MediaStream> => {
  if (!hasGetUserMedia()) {
    throw new Error("Seu navegador não suporta acesso à câmera")
  }

  // Tenta diferentes configurações para maximizar a compatibilidade
  const constraints: MediaStreamConstraints = {
    video: {
      facingMode: options.facing || "environment",
      width: options.width ? { ideal: options.width } : undefined,
      height: options.height ? { ideal: options.height } : undefined,
      aspectRatio: options.aspectRatio ? { ideal: options.aspectRatio } : undefined,
    },
    audio: false,
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints)
  } catch (error: any) {
    // Se a câmera traseira falhar, tenta a frontal
    if (options.facing === "environment") {
      console.warn("Câmera traseira não disponível, tentando câmera frontal")
      return getCameraStream({ ...options, facing: "user" })
    }

    // Se a configuração específica falhar, tenta uma configuração mais simples
    if (options.width || options.height || options.aspectRatio) {
      console.warn("Falha com configurações específicas, tentando configuração básica")
      return getCameraStream({ facing: options.facing })
    }

    // Trata erros específicos
    if (error.name === "NotAllowedError") {
      throw new Error("Permissão para acessar a câmera foi negada")
    } else if (error.name === "NotFoundError") {
      throw new Error("Nenhuma câmera encontrada no dispositivo")
    } else if (error.name === "NotReadableError") {
      throw new Error("A câmera está sendo usada por outro aplicativo")
    } else if (error.name === "OverconstrainedError") {
      throw new Error("As configurações solicitadas não são suportadas pela câmera")
    } else if (error.name === "AbortError") {
      throw new Error("A operação da câmera foi cancelada")
    } else if (error.name === "SecurityError") {
      throw new Error("O uso da câmera foi bloqueado por motivos de segurança")
    } else if (error.name === "TypeError") {
      throw new Error("Configuração de câmera inválida")
    } else {
      throw new Error(`Erro ao acessar a câmera: ${error.message || "Erro desconhecido"}`)
    }
  }
}

// Para o stream da câmera
export const stopCameraStream = (stream: MediaStream | null): void => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
}

// Captura uma foto do stream de vídeo
export const capturePhoto = (
  videoElement: HTMLVideoElement,
  options: { width?: number; height?: number; quality?: number } = {},
): string => {
  try {
    const canvas = document.createElement("canvas")
    const width = options.width || videoElement.videoWidth
    const height = options.height || videoElement.videoHeight
    const quality = options.quality || 0.8

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("Não foi possível criar o contexto do canvas")
    }

    // Desenha o frame atual do vídeo no canvas
    context.drawImage(videoElement, 0, 0, width, height)

    // Converte o canvas para uma URL de dados (base64)
    return canvas.toDataURL("image/jpeg", quality)
  } catch (error) {
    console.error("Erro ao capturar foto:", error)
    throw new Error("Falha ao capturar foto do vídeo")
  }
}

// Redimensiona uma imagem base64
export const resizeBase64Image = (
  base64Image: string,
  maxWidth: number,
  maxHeight: number,
  quality = 0.8,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calcula as novas dimensões mantendo a proporção
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Não foi possível criar o contexto do canvas"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }

      img.onerror = () => {
        reject(new Error("Erro ao carregar a imagem"))
      }

      img.src = base64Image
    } catch (error) {
      console.error("Erro ao redimensionar imagem:", error)
      reject(new Error("Falha ao redimensionar imagem"))
    }
  })
}

// Verifica o tamanho de uma imagem base64 em bytes
export const getBase64ImageSize = (base64Image: string): number => {
  try {
    // Remove o cabeçalho da string base64 (ex: "data:image/jpeg;base64,")
    const base64WithoutHeader = base64Image.split(",")[1]

    // Calcula o tamanho aproximado em bytes
    return Math.ceil((base64WithoutHeader.length * 3) / 4)
  } catch (error) {
    console.error("Erro ao calcular tamanho da imagem:", error)
    return 0
  }
}

// Comprime uma imagem base64 para um tamanho máximo em bytes
export const compressBase64Image = async (
  base64Image: string,
  maxSizeInBytes: number = 500 * 1024, // 500KB por padrão
  initialQuality = 0.9,
  minQuality = 0.1,
): Promise<string> => {
  try {
    let quality = initialQuality
    let compressedImage = base64Image
    let currentSize = getBase64ImageSize(base64Image)

    // Se a imagem já for menor que o tamanho máximo, retorna a original
    if (currentSize <= maxSizeInBytes) {
      return base64Image
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = base64Image
    })

    // Tenta comprimir a imagem reduzindo a qualidade
    while (currentSize > maxSizeInBytes && quality > minQuality) {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Não foi possível criar o contexto do canvas")
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Reduz a qualidade em 10% a cada iteração
      quality -= 0.1
      compressedImage = canvas.toDataURL("image/jpeg", quality)
      currentSize = getBase64ImageSize(compressedImage)
    }

    // Se ainda for muito grande, reduz as dimensões
    if (currentSize > maxSizeInBytes) {
      const maxDimension = 1200 // Limita a dimensão máxima
      compressedImage = await resizeBase64Image(compressedImage, maxDimension, maxDimension, quality)
    }

    return compressedImage
  } catch (error) {
    console.error("Erro ao comprimir imagem:", error)
    // Em caso de erro, retorna a imagem original
    return base64Image
  }
}

// Verifica se a câmera está disponível
export const isCameraAvailable = async (): Promise<boolean> => {
  if (!hasGetUserMedia()) {
    return false
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    stopCameraStream(stream)
    return true
  } catch (error) {
    console.error("Câmera não disponível:", error)
    return false
  }
}
