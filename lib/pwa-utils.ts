// Verifica o status do service worker
export const checkServiceWorkerStatus = async (): Promise<string> => {
  if (!("serviceWorker" in navigator)) {
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
  // Verifica se está em modo standalone (instalado)
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

  // Verifica se o usuário marcou como instalado no localStorage
  const markedAsInstalled = localStorage.getItem("pwa-installed") === "true"

  return isStandalone || markedAsInstalled
}

// Verifica se o dispositivo está online
export const isOnline = (): boolean => {
  return navigator.onLine
}

// Registra o service worker
export const registerServiceWorker = async (): Promise<void> => {
  if (!("serviceWorker" in navigator)) {
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
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none", // Sempre verifica atualizações do service worker
    })
    console.log("Service Worker registrado com sucesso:", registration.scope)

    // Configura o listener para atualizações
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // Há uma nova versão disponível
            showUpdateNotification()
          }
        })
      }
    })

    // Verifica se há uma atualização disponível imediatamente
    registration.update()
  } catch (error) {
    console.error("Falha ao registrar o Service Worker:", error)
  }
}

// Mostra uma notificação de atualização
function showUpdateNotification() {
  // Verifica se já existe uma notificação
  if (document.getElementById("update-notification")) return

  const notification = document.createElement("div")
  notification.id = "update-notification"
  notification.className =
    "fixed bottom-20 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex justify-between items-center"
  notification.innerHTML = `
    <div>Nova versão disponível! Atualize para obter as últimas melhorias.</div>
    <button id="update-now" class="bg-white text-blue-600 px-3 py-1 rounded ml-2">Atualizar</button>
  `

  document.body.appendChild(notification)

  document.getElementById("update-now")?.addEventListener("click", () => {
    applyPendingUpdates()
    notification.remove()
  })
}

// Força a atualização do service worker
export const updateServiceWorker = async (): Promise<boolean> => {
  if (!("serviceWorker" in navigator)) {
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
  if (!("caches" in window)) {
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
  if (!("serviceWorker" in navigator)) {
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
  if (!("serviceWorker" in navigator)) {
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

    // Recarrega a página para aplicar as alterações
    setTimeout(() => {
      window.location.reload()
    }, 500)

    return true
  } catch (error) {
    console.error("Erro ao aplicar atualizações:", error)
    return false
  }
}

// Verifica se o navegador suporta PWA
export const isPWASupported = (): boolean => {
  // Check if we're in a preview environment
  const isPreviewEnvironment =
    window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel.app")

  if (isPreviewEnvironment) {
    return false
  }

  return (
    ("serviceWorker" in navigator && "caches" in window && window.location.protocol === "https:") ||
    window.location.hostname === "localhost"
  )
}

// Mostra um prompt para instalar o PWA
export const showInstallPrompt = async (): Promise<boolean> => {
  // Verifica se temos o evento beforeinstallprompt armazenado
  const promptEvent = (window as any).deferredPrompt

  if (!promptEvent) {
    console.log("Prompt de instalação não disponível")

    // Verifica se já está instalado
    if (isPWAInstalled()) {
      console.log("PWA já está instalado")
      alert("O aplicativo já está instalado no seu dispositivo!")
      return true
    }

    // Verifica se estamos em iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

    if (isIOS) {
      // Em iOS, mostramos instruções de como instalar manualmente com imagens
      showIOSInstallInstructions()
      return false
    }

    // Para Android, mostramos instruções específicas
    const isAndroid = /Android/.test(navigator.userAgent)
    if (isAndroid) {
      showAndroidInstallInstructions()
      return false
    }

    // Para outros navegadores, mostramos instruções genéricas
    alert(
      "Para instalar este aplicativo:\n\n1. Abra o menu do navegador\n2. Selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'\n3. Siga as instruções na tela",
    )
    return false
  }

  try {
    // Mostra o prompt
    promptEvent.prompt()

    // Espera o usuário responder ao prompt
    const choiceResult = await promptEvent.userChoice

    // Limpa o evento armazenado
    delete (window as any).deferredPrompt

    // Se o usuário aceitou, marca como instalado no localStorage
    if (choiceResult.outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true")

      // Mostra uma mensagem de sucesso
      setTimeout(() => {
        alert("InspeFogo foi instalado com sucesso! Agora você pode usá-lo offline.")
      }, 1000)
    }

    return choiceResult.outcome === "accepted"
  } catch (error) {
    console.error("Erro ao mostrar prompt de instalação:", error)
    return false
  }
}

// Mostra instruções de instalação para iOS
function showIOSInstallInstructions() {
  // Cria um modal com instruções visuais
  const modal = document.createElement("div")
  modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/70"
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
      <h3 class="text-lg font-bold mb-4">Instalar no iOS</h3>
      <ol class="list-decimal pl-5 mb-4 space-y-2">
        <li>Toque no botão de compartilhamento <span class="inline-block px-2 py-1 bg-gray-200 rounded">↑</span></li>
        <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
        <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
      </ol>
      <div class="flex justify-center mb-4">
        <div class="bg-gray-100 p-2 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2"><path d="M4 12h16"/><path d="M4 18V6"/><path d="M12 4v16"/><path d="M20 18V6"/></svg>
          <p class="text-xs text-center">Compartilhar</p>
        </div>
      </div>
      <button id="close-ios-instructions" class="w-full bg-red-600 text-white py-2 rounded">Entendi</button>
    </div>
  `
  document.body.appendChild(modal)

  document.getElementById("close-ios-instructions")?.addEventListener("click", () => {
    modal.remove()
  })
}

// Mostra instruções de instalação para Android
function showAndroidInstallInstructions() {
  // Cria um modal com instruções visuais
  const modal = document.createElement("div")
  modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/70"
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
      <h3 class="text-lg font-bold mb-4">Instalar no Android</h3>
      <ol class="list-decimal pl-5 mb-4 space-y-2">
        <li>Toque no menu (três pontos) no canto superior direito</li>
        <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></li>
        <li>Siga as instruções na tela</li>
      </ol>
      <div class="flex justify-center mb-4">
        <div class="bg-gray-100 p-2 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          <p class="text-xs text-center">Menu</p>
        </div>
      </div>
      <button id="close-android-instructions" class="w-full bg-red-600 text-white py-2 rounded">Entendi</button>
    </div>
  `
  document.body.appendChild(modal)

  document.getElementById("close-android-instructions")?.addEventListener("click", () => {
    modal.remove()
  })
}

// Configura o listener para o evento beforeinstallprompt
export const setupInstallPrompt = (): void => {
  // Remove qualquer listener existente para evitar duplicação
  const oldHandler = (window as any)._installPromptHandler
  if (oldHandler) {
    window.removeEventListener("beforeinstallprompt", oldHandler)
  }

  // Cria um novo handler
  const handler = (e: Event) => {
    // Previne o comportamento padrão
    e.preventDefault()

    // Armazena o evento para uso posterior
    ;(window as any).deferredPrompt = e

    // Dispara um evento customizado para notificar componentes
    window.dispatchEvent(new CustomEvent("pwaInstallable", { detail: true }))

    // Mostra um botão de instalação personalizado
    const installButton = document.querySelector(".pwa-install-button")
    if (installButton) {
      installButton.classList.add("visible")
    }

    // Adiciona um banner de instalação na parte superior da página
    if (!document.getElementById("pwa-install-banner")) {
      const banner = document.createElement("div")
      banner.id = "pwa-install-banner"
      banner.className = "fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50 flex justify-between items-center"
      banner.innerHTML = `
        <div>Instale o InspeFogo para usar offline!</div>
        <button id="install-from-banner" class="bg-white text-red-600 px-3 py-1 rounded ml-2">Instalar</button>
        <button id="close-banner" class="ml-2 text-white">&times;</button>
      `

      document.body.appendChild(banner)

      document.getElementById("install-from-banner")?.addEventListener("click", () => {
        showInstallPrompt()
      })

      document.getElementById("close-banner")?.addEventListener("click", () => {
        banner.remove()
        localStorage.setItem("install-banner-dismissed", Date.now().toString())
      })
    }
  }

  // Armazena o handler para poder removê-lo depois
  ;(window as any)._installPromptHandler = handler

  window.addEventListener("beforeinstallprompt", handler)

  // Limpa o prompt quando o PWA é instalado
  window.addEventListener("appinstalled", () => {
    delete (window as any).deferredPrompt

    // Dispara um evento customizado
    window.dispatchEvent(new CustomEvent("pwaInstalled", { detail: true }))

    // Esconde o botão de instalação
    const installButton = document.querySelector(".pwa-install-button")
    if (installButton) {
      installButton.classList.remove("visible")
    }

    // Remove o banner de instalação
    const banner = document.getElementById("pwa-install-banner")
    if (banner) {
      banner.remove()
    }

    // Registra que o app foi instalado
    localStorage.setItem("pwa-installed", "true")

    // Mostra uma mensagem de sucesso
    alert("InspeFogo foi instalado com sucesso! Agora você pode usá-lo offline.")
  })
}

// Pré-carrega recursos importantes
export const preloadResources = async (): Promise<void> => {
  // Lista de recursos importantes para pré-carregar
  const criticalResources = [
    "/dashboard",
    "/historico",
    "/inspecao/extintores",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
  ]

  // Verifica se o navegador suporta preload
  if (!("preload" in HTMLLinkElement.prototype)) {
    return
  }

  // Cria links de preload para cada recurso
  criticalResources.forEach((resource) => {
    const link = document.createElement("link")
    link.rel = "preload"
    link.href = resource

    // Define o tipo correto com base na extensão
    if (resource.endsWith(".png") || resource.endsWith(".jpg") || resource.endsWith(".jpeg")) {
      link.as = "image"
    } else if (resource.endsWith(".js")) {
      link.as = "script"
    } else if (resource.endsWith(".css")) {
      link.as = "style"
    } else {
      link.as = "fetch"
      link.crossOrigin = "anonymous"
    }

    document.head.appendChild(link)
  })
}

// Verifica se o dispositivo tem suporte a recursos offline avançados
export const hasAdvancedOfflineSupport = (): boolean => {
  return (
    "serviceWorker" in navigator &&
    "SyncManager" in window &&
    "BackgroundFetchManager" in window &&
    "PushManager" in window
  )
}

// Verifica se o aplicativo está sendo executado em modo standalone (instalado)
export const isRunningStandalone = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    localStorage.getItem("pwa-installed") === "true"
  )
}

// Verifica se o dispositivo tem espaço de armazenamento suficiente
export const checkStorageSpace = async (): Promise<{ available: boolean; quota?: number; usage?: number }> => {
  if (!("storage" in navigator && "estimate" in navigator.storage)) {
    return { available: true }
  }

  try {
    const estimate = await navigator.storage.estimate()
    const availableSpace = estimate.quota! - estimate.usage!
    const minimumRequired = 50 * 1024 * 1024 // 50MB

    return {
      available: availableSpace > minimumRequired,
      quota: estimate.quota,
      usage: estimate.usage,
    }
  } catch (error) {
    console.error("Erro ao verificar espaço de armazenamento:", error)
    return { available: true }
  }
}

// Solicita permissão para notificações
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  } catch (error) {
    console.error("Erro ao solicitar permissão para notificações:", error)
    return false
  }
}

// Registra para receber notificações push
export const registerForPushNotifications = async (): Promise<boolean> => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Solicita permissão
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      return false
    }

    // Inscreve para notificações push
    // Nota: Em um ambiente real, você precisaria de uma chave pública do seu servidor
    // const subscription = await registration.pushManager.subscribe({
    //   userVisibleOnly: true,
    //   applicationServerKey: urlBase64ToUint8Array('sua-chave-publica-aqui')
    // })

    // Envia a inscrição para o servidor
    // await fetch('/api/register-push', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription)
    // })

    return true
  } catch (error) {
    console.error("Erro ao registrar para notificações push:", error)
    return false
  }
}

// Função auxiliar para converter chave base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
