// Nome do cache
const CACHE_NAME = "fireinspect-v4"

// Arquivos a serem cacheados inicialmente (recursos críticos)
const CORE_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/offline.html",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/css/globals.css",
  "/css/tailwind.css",
  "/styles/globals.css",
  "/_next/static/css/app/layout.css",
  "/_next/static/css/app/page.css",
  "/_next/static/css/app/dashboard/page.css",
  "/_next/static/css/app/configuracoes/page.css",
  "/_next/static/css/app/historico/page.css",
  "/_next/static/css/app/inspecao/[tipo]/page.css"
]

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
  networkFirst: [
    { urlPattern: /\/api\//, method: "GET" },
    { urlPattern: /\/_next\/data\/.*\.json$/ }
  ],

  // Recursos que devem ser servidos do cache, com atualização em segundo plano
  staleWhileRevalidate: [
    { urlPattern: /\.(js|css|png|jpg|jpeg|gif|svg|ico)$/ },
    { urlPattern: /\/dashboard/ },
    { urlPattern: /\/historico/ },
    { urlPattern: /\/configuracoes/ },
    { urlPattern: /\/inspecao\// },
    { urlPattern: /\/_next\/static\/.*/ }
  ],

  // Recursos que devem ser servidos do cache, sem verificar a rede
  cacheOnly: [
    { urlPattern: /\/icons\// },
    { urlPattern: /\/manifest\.json$/ },
    { urlPattern: /\/offline\.html$/ }
  ],
}

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      
      // Cache dos assets críticos
      await Promise.all(
        CORE_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset)
            if (!response.ok) {
              throw new Error(`Falha ao buscar ${asset}: ${response.status}`)
            }
            await cache.put(asset, response)
          } catch (error) {
            console.error(`Erro ao cachear ${asset}:`, error)
          }
        })
      )
      
      // Ativa o Service Worker imediatamente
      await self.skipWaiting()
    })(),
  )
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Limpa caches antigos
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(async (key) => {
          if (key !== CACHE_NAME) {
            await caches.delete(key);
          }
        })
      );
      
      // Toma controle de todas as páginas abertas
      await self.clients.claim();
      
      // Agenda limpeza periódica do cache
      setInterval(async () => {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        
        // Remove recursos não utilizados há mais de 7 dias
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        await Promise.all(
          requests.map(async (request) => {
            const response = await cache.match(request);
            if (response) {
              const headers = response.headers;
              const date = headers.get('date');
              if (date && new Date(date).getTime() < sevenDaysAgo) {
                await cache.delete(request);
              }
            }
          })
        );
      }, 24 * 60 * 60 * 1000); // Executa a cada 24 horas
    })()
  )
})

// Função para determinar a estratégia de cache com base na URL
function getStrategy(request) {
  const url = new URL(request.url)

  // Se for uma requisição de API, use networkFirst
  if (url.pathname.startsWith('/api/')) {
    return 'networkFirst'
  }

  // Se for um asset estático, use staleWhileRevalidate
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return 'staleWhileRevalidate'
  }

  // Se for uma página HTML, use networkFirst
  if (url.pathname.match(/\.html$/) || !url.pathname.includes('.')) {
    return 'networkFirst'
  }

  // Para todos os outros casos, use networkFirst
  return 'networkFirst'
}

// Interceptação de requisições
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignora requisições para outros domínios
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Trata requisições POST
  if (request.method === 'POST') {
    event.respondWith(
      (async () => {
        try {
          // Tenta enviar a requisição
          const response = await fetch(request);
          
          // Se falhar, armazena para sincronização posterior
          if (!response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
            return new Response(
              JSON.stringify({
                message: 'Requisição armazenada para sincronização posterior',
                offline: true
              }),
              {
                status: 202,
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
          }
          
          return response;
        } catch (error) {
          // Se estiver offline, armazena a requisição
          const cache = await caches.open(CACHE_NAME);
          const clonedRequest = request.clone();
          const offlineResponse = new Response(
            JSON.stringify({
              message: 'Requisição armazenada para sincronização posterior',
              offline: true
            }),
            {
              status: 202,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          await cache.put(clonedRequest, offlineResponse.clone());
          return offlineResponse;
        }
      })()
    );
    return;
  }
  
  // Trata outras requisições normalmente
  event.respondWith(
    (async () => {
      try {
        const strategy = getStrategy(request);
        
        switch (strategy) {
          case 'networkFirst':
            try {
              const networkResponse = await fetch(request);
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, networkResponse.clone());
              return networkResponse;
            } catch (error) {
              const cachedResponse = await caches.match(request);
              if (cachedResponse) {
                return cachedResponse;
              }
              return handleOfflineResponse(request);
            }
            
          case 'staleWhileRevalidate':
            const cachedResponse = await caches.match(request);
            const networkResponsePromise = fetch(request).then(response => {
              const cache = caches.open(CACHE_NAME);
              cache.put(request, response.clone());
              return response;
            });
            return cachedResponse || networkResponsePromise;
            
          case 'cacheOnly':
            return caches.match(request) || handleOfflineResponse(request);
            
          default:
            return fetch(request);
        }
      } catch (error) {
        return handleOfflineResponse(request);
      }
    })()
  );
})

// Função para lidar com respostas offline
async function handleOfflineResponse(request) {
    const url = new URL(request.url);
    
    // Se for uma requisição de API, retorne um erro JSON
    if (url.pathname.startsWith('/api/')) {
        return new Response(
            JSON.stringify({
                error: 'Você está offline. Os dados serão sincronizados quando a conexão for restaurada.'
            }),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
    
    // Se for uma página HTML, retorne a página offline
    if (url.pathname.match(/\.html$/) || !url.pathname.includes('.')) {
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) {
            return offlinePage;
        }
    }
    
    // Para outros tipos de conteúdo, retorne uma mensagem de erro genérica
    return new Response(
        'Você está offline. Por favor, verifique sua conexão com a internet.',
        {
            status: 503,
            headers: {
                'Content-Type': 'text/plain'
            }
        }
    );
}

// Limpa cache antigo
async function cleanOldCache() {
  const cache = await caches.open(CACHE_NAME)
  const requests = await cache.keys()
  
  // Remove recursos que não estão mais sendo usados
  for (const request of requests) {
    const url = new URL(request.url)
    if (!CORE_ASSETS.includes(url.pathname) && !SECONDARY_ASSETS.includes(url.pathname)) {
      await cache.delete(request)
    }
  }
}

// Sincronização de dados offline
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-inspecoes") {
    event.waitUntil(syncInspecoes())
  }
})

// Sincroniza inspeções offline
async function syncInspecoes() {
  try {
    const db = await openDB()
    const inspecoes = await db.getAll("inspecoes")
    
    for (const inspecao of inspecoes) {
      if (inspecao.syncStatus === "pending") {
        try {
          const response = await fetch("/api/inspecoes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(inspecao)
          })

          if (response.ok) {
            // Atualiza o status de sincronização
            inspecao.syncStatus = "synced"
            await db.put("inspecoes", inspecao)
          }
        } catch (error) {
          console.error("Erro ao sincronizar inspeção:", error)
        }
      }
    }
  } catch (error) {
    console.error("Erro ao sincronizar inspeções:", error)
  }
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

// Função para sincronizar dados offline
async function syncOfflineData() {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Filtra apenas requisições POST pendentes
    const pendingRequests = requests.filter(request => 
        request.method === 'POST' && 
        request.url.startsWith(self.location.origin + '/api/')
    );
    
    // Tenta enviar cada requisição pendente
    for (const request of pendingRequests) {
        try {
            const response = await cache.match(request);
            if (!response) continue;
            
            const data = await response.clone().json();
            const newResponse = await fetch(request.url, {
                method: 'POST',
                headers: request.headers,
                body: JSON.stringify(data)
            });
            
            if (newResponse.ok) {
                // Remove a requisição pendente do cache
                await cache.delete(request);
            }
        } catch (error) {
            console.error('Erro ao sincronizar requisição:', error);
        }
    }
}

// Adiciona listener para eventos de conexão
self.addEventListener('online', () => {
    syncOfflineData();
});
