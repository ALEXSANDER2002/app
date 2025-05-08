// Verifica se o código está rodando no navegador
const isBrowser = typeof window !== 'undefined'

// Verifica o status do service worker
export const checkServiceWorkerStatus = async (): Promise<string> => {
  if (!isBrowser || !("serviceWorker" in navigator)) {
    return "Service Worker não suportado"
  }

  // Check if we're in a preview environment
  const isPreviewEnvironment =
    window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app")

  if (isPreviewEnvironment) {
    return "Service Worker indisponível no ambiente de preview"
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      return "Service Worker não registrado"
    }

    return "PWA ativo"
  } catch (error) {
    console.error("Erro ao verificar Service Worker:", error)
    return "Erro ao verificar Service Worker"
  }
}

// Verifica se o app está instalado
export const isPWAInstalled = (): boolean => {
  if (!isBrowser) return false
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true
}

// Verifica se o dispositivo está online
export const isOnline = (): boolean => {
  if (!isBrowser) return true
  return navigator.onLine
}

// Registra o service worker
export const registerServiceWorker = async (): Promise<void> => {
  if (!isBrowser || !("serviceWorker" in navigator)) {
    console.log("Service Worker não é suportado neste navegador")
    return
  }

  // Check if we're in a preview environment
  const isPreviewEnvironment =
    window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app")

  if (isPreviewEnvironment) {
    console.log("Service Worker não disponível no ambiente de preview")
    return
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
    console.log("Service Worker registrado com sucesso:", registration.scope)
  } catch (error) {
    console.error("Falha ao registrar o Service Worker:", error)
  }
}

// Força a atualização do service worker
export const updateServiceWorker = async (): Promise<boolean> => {
  if (!isBrowser || !("serviceWorker" in navigator)) {
    return false
  }

  // Check if we're in a preview environment
  const isPreviewEnvironment =
    window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app")

  if (isPreviewEnvironment) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      return false
    }

    await registration.update()
    return true
  } catch (error) {
    console.error("Erro ao atualizar Service Worker:", error)
    return false
  }
}

// Limpa o cache do service worker
export const clearCache = async (): Promise<boolean> => {
  if (!isBrowser || !("caches" in window)) {
    return false
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((name) => caches.delete(name)))
    return true
  } catch (error) {
    console.error("Erro ao limpar cache:", error)
    return false
  }
}

// Verifica se há atualizações disponíveis
export const checkForUpdates = async (): Promise<boolean> => {
  if (!isBrowser || !("serviceWorker" in navigator)) {
    return false
  }

  // Check if we're in a preview environment
  const isPreviewEnvironment =
    window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app")

  if (isPreviewEnvironment) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      return false
    }

    // Força uma verificação de atualização
    await registration.update()

    // Verifica se há um novo service worker esperando
    return !!registration.waiting
  } catch (error) {
    console.error("Erro ao verificar atualizações:", error)
    return false
  }
}

// Aplica atualizações pendentes
export const applyPendingUpdates = async (): Promise<boolean> => {
  if (!isBrowser || !("serviceWorker" in navigator)) {
    return false
  }

  // Check if we're in a preview environment
  const isPreviewEnvironment =
    window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app")

  if (isPreviewEnvironment) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration || !registration.waiting) {
      return false
    }

    // Envia uma mensagem para o service worker esperando para assumir o controle
    registration.waiting.postMessage({ type: "SKIP_WAITING" })
    return true
  } catch (error) {
    console.error("Erro ao aplicar atualizações:", error)
    return false
  }
}

// Verifica se o navegador suporta PWA
export const isPWASupported = (): boolean => {
  if (!isBrowser) return false

  // Check if we're in a preview environment
  const isPreviewEnvironment =
    window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app")

  if (isPreviewEnvironment) {
    return false
  }

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    ("serviceWorker" in navigator && "caches" in window && window.location.protocol === "https:") ||
    isLocalhost
  )
}

// Mostra um prompt para instalar o PWA
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!isBrowser) return false

  // Verifica se temos o evento beforeinstallprompt armazenado
  const promptEvent = (window as any).deferredPrompt

  if (!promptEvent) {
    return false
  }

  try {
    // Mostra o prompt
    promptEvent.prompt()

    // Espera o usuário responder ao prompt
    const choiceResult = await promptEvent.userChoice

    // Limpa o evento armazenado
    delete (window as any).deferredPrompt

    return choiceResult.outcome === "accepted"
  } catch (error) {
    console.error("Erro ao mostrar prompt de instalação:", error)
    return false
  }
}

// Configura o listener para o evento beforeinstallprompt
export const setupInstallPrompt = (): void => {
  if (!isBrowser) return

  window.addEventListener("beforeinstallprompt", (e) => {
    // Previne o comportamento padrão
    e.preventDefault()

    // Armazena o evento para uso posterior
    ;(window as any).deferredPrompt = e

    // Mostra um botão de instalação personalizado
    const installButton = document.querySelector(".pwa-install-button")
    if (installButton) {
      installButton.classList.add("visible")
    }
  })

  // Limpa o prompt quando o PWA é instalado
  window.addEventListener("appinstalled", () => {
    delete (window as any).deferredPrompt

    // Esconde o botão de instalação
    const installButton = document.querySelector(".pwa-install-button")
    if (installButton) {
      installButton.classList.remove("visible")
    }
  })
}
