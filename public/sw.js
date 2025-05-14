// Atualizar a versão do cache para forçar a atualização dos recursos
const CACHE_NAME = "fireinspect-v4"

// Expandir a lista de arquivos a serem cacheados inicialmente (recursos críticos)
const CORE_ASSETS = [
  "/",
  "/landing",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/globals.css",
  "/index.js",
  "/_next/static/chunks/main.js",
  "/_next/static/chunks/webpack.js",
  "/_next/static/chunks/app-client.js",
  "/_next/static/css/app.css",
  // Adicionar mais recursos críticos
  "/historico",
  "/configuracoes",
  "/inspecao/extintores",
  "/inspecao/mangueiras",
  "/inspecao/acidentes",
  "/inspecao/alarmes",
]

// Expandir a lista de arquivos a serem cacheados em segundo plano
const SECONDARY_ASSETS = [
  "/historico",
  "/configuracoes",
  "/inspecao/extintores",
  "/inspecao/mangueiras",
  "/inspecao/acidentes",
  "/inspecao/alarmes",
  "/error",
  "/not-found",
]

// Estratégia de cache para diferentes tipos de recursos
const CACHE_STRATEGIES = {
  // Recursos que devem ser sempre atualizados da rede, com fallback para cache
  networkFirst: [
    { urlPattern: /\/api\//, method: "GET" },
    { urlPattern: /\/dashboard/, method: "GET" },
  ],

  // Recursos que devem ser servidos do cache, com atualização em segundo plano
  staleWhileRevalidate: [
    { urlPattern: /\.(js|css)$/ },
    { urlPattern: /\/historico/ },
    { urlPattern: /\/configuracoes/ },
    { urlPattern: /\/inspecao\// },
    { urlPattern: /_next\/static\// },
    { urlPattern: /\/landing/ },
  ],

  // Recursos que devem ser servidos do cache, sem verificar a rede
  cacheOnly: [
    { urlPattern: /\/icons\// },
    { urlPattern: /\/manifest\.json$/ },
    { urlPattern: /\.(png|jpg|jpeg|gif|svg|webp)$/ },
  ],

  // Recursos que devem ser cacheados na primeira vez que são acessados
  cacheFirst: [{ urlPattern: /\.(woff|woff2|ttf|otf)$/ }, { urlPattern: /\/placeholder\.svg/ }],
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

      // Notifica os clientes que o service worker foi atualizado
      const clients = await self.clients.matchAll({ type: "window" })
      clients.forEach((client) => {
        client.postMessage({
          type: "SW_UPDATED",
          version: CACHE_NAME,
        })
      })
    })(),
  )
})

// Função para determinar a estratégia de cache com base na URL
function getStrategy(request) {
  const url = new URL(request.url)

  // Ignora requisições para outros domínios, exceto para fontes e CDNs comuns
  if (
    url.origin !== self.location.origin &&
    !url.hostname.includes("fonts.googleapis.com") &&
    !url.hostname.includes("fonts.gstatic.com") &&
    !url.hostname.includes("cdn")
  ) {
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
  // Ignora requisições não GET
  if (event.request.method !== "GET") return

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

    case "cacheFirst":
      event.respondWith(cacheFirst(event.request))
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

// Estratégia: Cache primeiro, rede como fallback
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    // Salva no cache para uso futuro
    cache.put(request, networkResponse.clone())

    return networkResponse
  } catch (error) {
    // Se não conseguir buscar da rede, tenta encontrar uma página similar no cache
    // Isso é útil para rotas dinâmicas
    if (request.mode === "navigate") {
      const urls = await cache.keys()
      const similarUrls = urls.filter((r) => r.url.includes(new URL(request.url).pathname.split("/")[1]))

      if (similarUrls.length > 0) {
        return cache.match(similarUrls[0])
      }
    }

    return createOfflineResponse(request)
  }
}

// Cria uma resposta personalizada para quando estiver offline
function createOfflineResponse(request) {
  // Se for uma navegação para uma página
  if (request.mode === "navigate") {
    return caches.match("/").then(
      (response) =>
        response ||
        new Response(
          `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>InspeFogo - Offline</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; background-color: #f8f9fa; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .icon { font-size: 48px; margin-bottom: 20px; }
            .btn { background: #ef4444; color: white; border: none; padding: 12px 24px; 
                  border-radius: 4px; cursor: pointer; font-weight: bold; }
            h1 { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📶</div>
            <h1>Você está offline</h1>
            <p>O InspeFogo funciona offline, mas esta página específica não foi carregada anteriormente.</p>
            <p>Tente acessar a página inicial ou verifique sua conexão.</p>
            <button class="btn" onclick="window.location.href='/'">Voltar para o início</button>
          </div>
        </body>
        </html>
        `,
          {
            status: 200,
            headers: { "Content-Type": "text/html" },
          },
        ),
    )
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
  return new Response("Offline - InspeFogo", {
    status: 503,
    statusText: "Serviço indisponível - Modo Offline",
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
  try {
    // Busca as inspeções pendentes de sincronização
    const db = await openDB()
    const tx = db.transaction("sync-queue", "readonly")
    const store = tx.objectStore("sync-queue")
    const pendingItems = await store.getAll()

    if (pendingItems.length === 0) {
      console.log("Nenhuma inspeção pendente para sincronizar")
      return
    }

    console.log(`Sincronizando ${pendingItems.length} inspeções...`)

    // Aqui você implementaria a lógica para enviar os dados para o servidor
    // Por exemplo:
    // for (const item of pendingItems) {
    //   await fetch('/api/inspecoes', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(item.data)
    //   })
    //
    //   // Remove o item da fila após sincronização bem-sucedida
    //   const deleteTx = db.transaction('sync-queue', 'readwrite')
    //   const deleteStore = deleteTx.objectStore('sync-queue')
    //   await deleteStore.delete(item.id)
    // }

    // Notifica os clientes que a sincronização foi concluída
    const clients = await self.clients.matchAll({ type: "window" })
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETED",
        count: pendingItems.length,
      })
    })
  } catch (error) {
    console.error("Erro ao sincronizar inspeções:", error)
  }
}

// Função auxiliar para abrir o banco de dados
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sync-db", 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("sync-queue")) {
        db.createObjectStore("sync-queue", { keyPath: "id", autoIncrement: true })
      }
    }

    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject(event.target.error)
  })
}

// Notificações push
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()

    const options = {
      body: data.body || "Nova notificação do InspeFogo",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
    }

    event.waitUntil(self.registration.showNotification(data.title || "InspeFogo", options))
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

  // Adiciona tratamento para solicitação de sincronização manual
  if (event.data && event.data.type === "SYNC_NOW") {
    syncInspecoes()
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

// Pré-carrega páginas comuns quando o service worker é instalado
async function precacheCommonPages() {
  const cache = await caches.open(CACHE_NAME)
  const pagesToPrecache = ["/", "/landing", "/dashboard", "/historico", "/configuracoes", "/inspecao/extintores"]

  for (const page of pagesToPrecache) {
    try {
      const response = await fetch(page)
      if (response.ok) {
        await cache.put(page, response)
      }
    } catch (error) {
      console.warn(`Falha ao pré-cachear ${page}:`, error)
    }
  }
}
