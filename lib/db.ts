// Definição do tipo de inspeção
export type Inspecao = {
  id?: number
  tipo: string
  local: string
  data: string
  observacoes: string
  foto: string
  timestamp: string
  usuario: string
}

// Nome do banco de dados
const DB_NAME = "inspecoes-bombeiros"
const DB_VERSION = 1
const STORE_NAME = "inspecoes"

// Cache para operações frequentes
const cache = {
  db: null as IDBDatabase | null,
  inspecoes: new Map<number, Inspecao>(),
  lastFetchTimestamp: 0,
}

// Tempo de expiração do cache (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000

// Inicializa o banco de dados IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  // Se já temos uma conexão aberta e válida, use-a
  if (cache.db) {
    return Promise.resolve(cache.db)
  }

  return new Promise((resolve, reject) => {
    // Verifica se IndexedDB está disponível
    if (!window.indexedDB) {
      reject("Seu navegador não suporta IndexedDB. Algumas funcionalidades podem não funcionar corretamente.")
      return
    }

    try {
      // Abre ou cria o banco de dados
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      // Chamado quando o banco de dados precisa ser criado ou atualizado
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Cria o object store para armazenar as inspeções
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          })

          // Cria índices para facilitar a busca
          store.createIndex("tipo", "tipo", { unique: false })
          store.createIndex("data", "data", { unique: false })
          store.createIndex("timestamp", "timestamp", { unique: false })
          store.createIndex("usuario", "usuario", { unique: false })
        }
      }

      // Chamado quando ocorre um erro
      request.onerror = (event) => {
        console.error("Erro ao abrir o banco de dados:", (event.target as IDBOpenDBRequest).error)
        reject(`Erro ao abrir o banco de dados: ${(event.target as IDBOpenDBRequest).error}`)
      }

      // Chamado quando o banco de dados é aberto com sucesso
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Configura tratamento de erro para a conexão
        db.onerror = (event) => {
          console.error("Erro no banco de dados:", (event.target as IDBDatabase).error)
        }

        cache.db = db
        resolve(db)
      }
    } catch (error) {
      console.error("Erro ao inicializar banco de dados:", error)
      reject(`Erro ao inicializar banco de dados: ${error}`)
    }
  })
}

// Adiciona uma nova inspeção ao banco de dados
export const addInspecao = async (inspecao: Inspecao): Promise<number> => {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)

        // Adiciona a inspeção ao store
        const request = store.add(inspecao)

        request.onsuccess = (event) => {
          const id = (event.target as IDBRequest).result as number

          // Atualiza o cache
          inspecao.id = id
          cache.inspecoes.set(id, inspecao)

          resolve(id)
        }

        request.onerror = (event) => {
          console.error("Erro ao adicionar inspeção:", (event.target as IDBRequest).error)
          reject(`Erro ao adicionar inspeção: ${(event.target as IDBRequest).error}`)
        }

        transaction.oncomplete = () => {
          // Não fecha o banco de dados aqui para reutilizar a conexão
        }

        transaction.onerror = (event) => {
          console.error("Erro na transação:", (event.target as IDBTransaction).error)
          reject(`Erro na transação: ${(event.target as IDBTransaction).error}`)
        }
      } catch (error) {
        console.error("Erro ao criar transação:", error)
        reject(`Erro ao criar transação: ${error}`)
      }
    })
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    throw new Error(`Falha ao adicionar inspeção: ${error}`)
  }
}

// Obtém todas as inspeções do banco de dados
export const getInspecoes = async (): Promise<Inspecao[]> => {
  try {
    // Verifica se o cache está válido
    const now = Date.now()
    if (cache.inspecoes.size > 0 && now - cache.lastFetchTimestamp < CACHE_EXPIRATION) {
      return Array.from(cache.inspecoes.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
    }

    const db = await initDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], "readonly")
        const store = transaction.objectStore(STORE_NAME)

        // Obtém todas as inspeções
        const request = store.getAll()

        request.onsuccess = (event) => {
          const inspecoes = (event.target as IDBRequest).result as Inspecao[]

          // Atualiza o cache
          cache.inspecoes.clear()
          inspecoes.forEach((inspecao) => {
            if (inspecao.id) {
              cache.inspecoes.set(inspecao.id, inspecao)
            }
          })
          cache.lastFetchTimestamp = now

          // Ordena por timestamp decrescente (mais recentes primeiro)
          inspecoes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          resolve(inspecoes)
        }

        request.onerror = (event) => {
          console.error("Erro ao obter inspeções:", (event.target as IDBRequest).error)
          reject(`Erro ao obter inspeções: ${(event.target as IDBRequest).error}`)
        }
      } catch (error) {
        console.error("Erro ao criar transação:", error)
        reject(`Erro ao criar transação: ${error}`)
      }
    })
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    // Retorna array vazio em caso de erro para evitar quebrar a UI
    return []
  }
}

// Obtém uma inspeção específica pelo ID
export const getInspecaoById = async (id: number): Promise<Inspecao | null> => {
  try {
    // Verifica se está no cache
    if (cache.inspecoes.has(id)) {
      return cache.inspecoes.get(id) || null
    }

    const db = await initDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], "readonly")
        const store = transaction.objectStore(STORE_NAME)

        // Obtém a inspeção pelo ID
        const request = store.get(id)

        request.onsuccess = (event) => {
          const inspecao = (event.target as IDBRequest).result as Inspecao

          // Atualiza o cache se encontrou a inspeção
          if (inspecao && inspecao.id) {
            cache.inspecoes.set(inspecao.id, inspecao)
          }

          resolve(inspecao || null)
        }

        request.onerror = (event) => {
          console.error("Erro ao obter inspeção:", (event.target as IDBRequest).error)
          reject(`Erro ao obter inspeção: ${(event.target as IDBRequest).error}`)
        }
      } catch (error) {
        console.error("Erro ao criar transação:", error)
        reject(`Erro ao criar transação: ${error}`)
      }
    })
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    return null
  }
}

// Exclui uma inspeção pelo ID
export const deleteInspecao = async (id: number): Promise<void> => {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)

        // Exclui a inspeção pelo ID
        const request = store.delete(id)

        request.onsuccess = () => {
          // Remove do cache
          cache.inspecoes.delete(id)
          resolve()
        }

        request.onerror = (event) => {
          console.error("Erro ao excluir inspeção:", (event.target as IDBRequest).error)
          reject(`Erro ao excluir inspeção: ${(event.target as IDBRequest).error}`)
        }
      } catch (error) {
        console.error("Erro ao criar transação:", error)
        reject(`Erro ao criar transação: ${error}`)
      }
    })
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    throw new Error(`Falha ao excluir inspeção: ${error}`)
  }
}

// Atualiza uma inspeção existente
export const updateInspecao = async (inspecao: Inspecao): Promise<void> => {
  try {
    if (!inspecao.id) {
      throw new Error("ID da inspeção é necessário para atualização")
    }

    const db = await initDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)

        // Atualiza a inspeção
        const request = store.put(inspecao)

        request.onsuccess = () => {
          // Atualiza o cache
          cache.inspecoes.set(inspecao.id!, inspecao)
          resolve()
        }

        request.onerror = (event) => {
          console.error("Erro ao atualizar inspeção:", (event.target as IDBRequest).error)
          reject(`Erro ao atualizar inspeção: ${(event.target as IDBRequest).error}`)
        }
      } catch (error) {
        console.error("Erro ao criar transação:", error)
        reject(`Erro ao criar transação: ${error}`)
      }
    })
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    throw new Error(`Falha ao atualizar inspeção: ${error}`)
  }
}

// Busca inspeções por tipo
export const getInspecoesByTipo = async (tipo: string): Promise<Inspecao[]> => {
  try {
    // Se o cache estiver completo, filtre do cache
    const now = Date.now()
    if (cache.inspecoes.size > 0 && now - cache.lastFetchTimestamp < CACHE_EXPIRATION) {
      return Array.from(cache.inspecoes.values())
        .filter((inspecao) => inspecao.tipo === tipo)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }

    const db = await initDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const index = store.index("tipo")
        const request = index.getAll(tipo)

        request.onsuccess = (event) => {
          const inspecoes = (event.target as IDBRequest).result as Inspecao[]
          inspecoes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          resolve(inspecoes)
        }

        request.onerror = (event) => {
          console.error("Erro ao buscar inspeções por tipo:", (event.target as IDBRequest).error)
          reject(`Erro ao buscar inspeções por tipo: ${(event.target as IDBRequest).error}`)
        }
      } catch (error) {
        console.error("Erro ao criar transação:", error)
        reject(`Erro ao criar transação: ${error}`)
      }
    })
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    // Retorna array vazio em caso de erro para evitar quebrar a UI
    return []
  }
}

// Limpa o cache
export const clearCache = (): void => {
  cache.inspecoes.clear()
  cache.lastFetchTimestamp = 0
}

// Fecha a conexão com o banco de dados
export const closeDB = (): void => {
  if (cache.db) {
    cache.db.close()
    cache.db = null
  }
}

// Verifica se o banco de dados está disponível
export const isDBAvailable = async (): Promise<boolean> => {
  try {
    await initDB()
    return true
  } catch (error) {
    console.error("Banco de dados não disponível:", error)
    return false
  }
}

// Recupera o banco de dados em caso de corrupção
export const recoverDB = async (): Promise<boolean> => {
  try {
    // Fecha qualquer conexão existente
    closeDB()

    // Limpa o cache
    clearCache()

    // Tenta excluir o banco de dados
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error("Falha ao excluir banco de dados"))
    })

    // Reinicializa o banco de dados
    await initDB()

    return true
  } catch (error) {
    console.error("Falha ao recuperar banco de dados:", error)
    return false
  }
}
