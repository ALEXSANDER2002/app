/**
 * Utilitários para melhorar a performance do aplicativo
 */

// Função para debounce - limita a frequência de execução de uma função
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Função para throttle - garante que uma função não seja executada mais que uma vez em um período
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Função para memoização - cache de resultados de funções
export function memoize<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>()

  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }
}

// Função para detectar se o dispositivo é de baixo desempenho
export function isLowPerformanceDevice(): boolean {
  // Verifica se é um dispositivo móvel
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Verifica a quantidade de memória RAM (se disponível)
  const lowMemory = "deviceMemory" in navigator && (navigator as any).deviceMemory < 4

  // Verifica o número de núcleos da CPU (se disponível)
  const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4

  return isMobile && (lowMemory || lowCPU)
}

// Função para otimizar o carregamento de imagens
export function optimizeImageLoading(imgElement: HTMLImageElement, src: string, lowQualitySrc?: string): void {
  // Se for um dispositivo de baixo desempenho e temos uma versão de baixa qualidade
  if (isLowPerformanceDevice() && lowQualitySrc) {
    imgElement.src = lowQualitySrc
    return
  }

  // Implementa carregamento lazy para imagens
  if ("loading" in HTMLImageElement.prototype) {
    imgElement.loading = "lazy"
  }

  // Implementa decodificação assíncrona
  imgElement.decoding = "async"

  // Define a fonte da imagem
  imgElement.src = src
}

// Função para limpar o cache de memória
export function clearMemoryCache(): void {
  // Tenta liberar memória não utilizada (funciona em alguns navegadores)
  if ("gc" in window) {
    ;(window as any).gc()
  }

  // Limpa caches de objetos que possam estar em memória
  if (caches && typeof caches.keys === "function") {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key.includes("temp-cache")) {
          caches.delete(key)
        }
      })
    })
  }
}

// Função para otimizar operações em lote no IndexedDB
export async function batchIndexedDBOperations<T>(operations: Array<() => Promise<T>>, batchSize = 10): Promise<T[]> {
  const results: T[] = []

  // Processa as operações em lotes para evitar sobrecarga
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map((op) => op()))
    results.push(...batchResults)

    // Pequena pausa entre lotes para não bloquear a UI
    if (i + batchSize < operations.length) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  return results
}

// Função para medir o tempo de execução (para diagnóstico)
export function measureExecutionTime<T>(func: () => T, label: string): T {
  const startTime = performance.now()
  const result = func()
  const endTime = performance.now()

  console.log(`[Performance] ${label}: ${(endTime - startTime).toFixed(2)}ms`)

  return result
}

// Função para medir o tempo de execução de funções assíncronas (para diagnóstico)
export async function measureAsyncExecutionTime<T>(func: () => Promise<T>, label: string): Promise<T> {
  const startTime = performance.now()
  const result = await func()
  const endTime = performance.now()

  console.log(`[Performance] ${label}: ${(endTime - startTime).toFixed(2)}ms`)

  return result
}

// Função para verificar o tamanho aproximado de um objeto em memória
export function getApproximateObjectSize(object: any): number {
  const objectString = JSON.stringify(object)
  return new Blob([objectString]).size
}

// Função para verificar se o dispositivo está em modo de economia de bateria
export function isBatterySavingMode(): Promise<boolean> {
  if ("getBattery" in navigator) {
    return (navigator as any).getBattery().then((battery: any) => {
      return battery.level < 0.2 && !battery.charging
    })
  }
  return Promise.resolve(false)
}

// Ajusta configurações com base no desempenho do dispositivo
export async function adjustPerformanceSettings(): Promise<{
  imageQuality: number
  animationsEnabled: boolean
  cacheStrategy: "aggressive" | "balanced" | "minimal"
}> {
  const lowPerformance = isLowPerformanceDevice()
  const batterySaving = await isBatterySavingMode()

  // Configurações padrão
  const settings = {
    imageQuality: 0.8,
    animationsEnabled: true,
    cacheStrategy: "balanced" as const,
  }

  // Ajusta com base no desempenho do dispositivo
  if (lowPerformance) {
    settings.imageQuality = 0.6
    settings.animationsEnabled = false
    settings.cacheStrategy = "aggressive"
  }

  // Ajusta ainda mais se estiver em modo de economia de bateria
  if (batterySaving) {
    settings.imageQuality = 0.5
    settings.animationsEnabled = false
    settings.cacheStrategy = "aggressive"
  }

  return settings
}
