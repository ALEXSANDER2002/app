// Nome do cache
const CACHE_NAME = "fireinspect-v3"

// Arquivos a serem cacheados inicialmente (recursos críticos)
const CORE_ASSETS = ["/", "/dashboard", "/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"]

// Arquivos a serem cacheados em segundo plano (recursos não críticos)
const SECONDARY_ASSETS = [
  "/historico",
  "/configuracoes",
  "/inspecao/extintores",
  "/inspecao/mangueiras",
  "/inspecao/acidentes",
  "/inspecao/alarmes",
]

// Estratégia de cache para diferentes tipos de recursos
const CACHE_STRATEGIES = {
  // Recursos que devem ser sempre atualizados da rede, com fallback para cache
  networkFirst: [{ urlPattern: /\/api\//, method: "GET" }],

  // Recursos que devem ser servidos do cache, com atualização em segundo plano
  staleWhileRevalidate: [
    { urlPattern: /\.(js|css)$/ },
    { urlPattern: /\/dashboard/ },
    { urlPattern: /\/historico/ },
    { urlPattern: /\/configuracoes/ },
    { urlPattern: /\/inspecao\// },
  ],

  // Recursos que devem ser servidos do cache, sem verificar a rede
  cacheOnly: [{ urlPattern: /\/icons\// }, { urlPattern: /\/manifest\.json$/ }],
}

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)

      // Cache dos recursos críticos
      await cache.addAll(CORE_ASSETS)

      // Cache dos recursos secundários em segundo plano
      try {
        await cache.addAll(SECONDARY_ASSETS)
      } catch (error) {
        console.warn("Falha ao cachear recursos secundários:", error)
      }

      // Força a ativação imediata
      await self.skipWaiting()
    })(),
  )
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Limpa caches antigos
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))

      // Toma controle de clientes não controlados
      await self.clients.claim()
    })(),
  )
})

// Função para determinar a estratégia de cache com base na URL
function getStrategy(request) {
  const url = new URL(request.url)

  // Ignora requisições para outros domínios
  if (url.origin !== self.location.origin) {
    return "network"
  }

  // Verifica se a requisição corresponde a alguma estratégia específica
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    for (const pattern of patterns) {
      if (pattern.urlPattern.test(url.pathname) && (!pattern.method || pattern.method === request.method)) {
        return strategy
      }
    }
  }

  // Estratégia padrão: staleWhileRevalidate
  return "staleWhileRevalidate"
}

// Interceptação de requisições
self.addEventListener("fetch", (event) => {
  const strategy = getStrategy(event.request)

  switch (strategy) {
    case "networkFirst":
      event.respondWith(networkFirst(event.request))
      break

    case "staleWhileRevalidate":
      event.respondWith(staleWhileRevalidate(event.request))
      break

    case "cacheOnly":
      event.respondWith(cacheOnly(event.request))
      break

    case "network":
      // Não intercepta, deixa o navegador lidar normalmente
      break

    default:
      event.respondWith(staleWhileRevalidate(event.request))
  }
})

// Estratégia: Rede primeiro, com fallback para cache
async function networkFirst(request) {
  try {
    // Tenta buscar da rede
    const networkResponse = await fetch(request)

    // Se sucesso, atualiza o cache
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, networkResponse.clone())

    return networkResponse
  } catch (error) {
    // Se falhar, tenta buscar do cache
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Se não estiver no cache, retorna uma resposta de erro personalizada
    return createOfflineResponse(request)
  }
}

// Estratégia: Cache primeiro, com atualização em segundo plano
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)

  // Tenta buscar do cache
  const cachedResponse = await cache.match(request)

  // Inicia a busca da rede em segundo plano
  const networkResponsePromise = fetch(request)
    .then((response) => {
      // Atualiza o cache com a nova resposta
      cache.put(request, response.clone())
      return response
    })
    .catch((error) => {
      console.warn(`Falha ao buscar ${request.url} da rede:`, error)
    })

  // Se tiver no cache, retorna imediatamente
  if (cachedResponse) {
    return cachedResponse
  }

  // Se não estiver no cache, espera a resposta da rede
  try {
    return await networkResponsePromise
  } catch (error) {
    // Se ambos falharem, retorna uma resposta de erro personalizada
    return createOfflineResponse(request)
  }
}

// Estratégia: Apenas cache
async function cacheOnly(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  // Se não estiver no cache, tenta buscar da rede uma vez
  try {
    const response = await fetch(request)

    // Atualiza o cache
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())

    return response
  } catch (error) {
    return createOfflineResponse(request)
  }
}

// Cria uma resposta personalizada para quando estiver offline
function createOfflineResponse(request) {
  // Se for uma navegação para uma página
  if (request.mode === "navigate") {
    return caches.match("/")
  }

  // Se for uma imagem
  if (request.destination === "image") {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><path d="M30,50 L70,50 M50,30 L50,70" stroke="#ccc" stroke-width="5"/></svg>',
      {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-store",
        },
      },
    )
  }

  // Para outros recursos
  return new Response("Offline", {
    status: 503,
    statusText: "Serviço indisponível",
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store",
    },
  })
}

// Sincronização em segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-inspecoes") {
    event.waitUntil(syncInspecoes())
  }
})

// Função para sincronizar inspeções quando online
async function syncInspecoes() {
  // Aqui você implementaria a lógica para enviar dados armazenados
  // localmente para um servidor quando a conexão for restabelecida
  console.log("Sincronizando inspeções...")
}

// Notificações push
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()

    const options = {
      body: data.body || "Nova notificação do FireInspect",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
    }

    event.waitUntil(self.registration.showNotification(data.title || "FireInspect", options))
  }
})

// Clique em notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Verifica se já existe uma janela aberta e a foca
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus()
        }
      }

      // Se não existir, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || "/")
      }
    }),
  )
})

// Escuta mensagens de outros contextos
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Limpa o cache periodicamente (a cada 7 dias)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "clean-cache") {
    event.waitUntil(cleanOldCache())
  }
})

// Função para limpar itens antigos do cache
async function cleanOldCache() {
  const cache = await caches.open(CACHE_NAME)
  const requests = await cache.keys()

  const now = Date.now()
  const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 dias

  for (const request of requests) {
    // Verifica se o item tem cabeçalho de data
    const response = await cache.match(request)
    if (!response) continue

    const dateHeader = response.headers.get("date")
    if (!dateHeader) continue

    const date = new Date(dateHeader).getTime()
    if (now - date > maxAge) {
      await cache.delete(request)
    }
  }
}
