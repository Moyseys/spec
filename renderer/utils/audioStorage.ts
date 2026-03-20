const AUDIO_DB_NAME = 'ghost-recordings-db'
const AUDIO_DB_VERSION = 1
const AUDIO_STORE_NAME = 'recording-blobs'

interface StoredRecordingBlob {
  id: string
  blob: Blob
}

const assertIndexedDbAvailable = () => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error('IndexedDB indisponível neste ambiente.')
  }
}

const openAudioDatabase = async (): Promise<IDBDatabase> => {
  assertIndexedDbAvailable()

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(AUDIO_DB_NAME, AUDIO_DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Falha ao abrir o armazenamento local de áudio.'))
    request.onblocked = () =>
      reject(new Error('O armazenamento local de áudio está bloqueado por outra instância.'))
  })
}

export const saveRecordingBlob = async (id: string, blob: Blob): Promise<void> => {
  const db = await openAudioDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(AUDIO_STORE_NAME)
    store.put({ id, blob } as StoredRecordingBlob)

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }

    transaction.onerror = () => {
      db.close()
      reject(
        transaction.error ?? new Error('Falha ao salvar a gravação no armazenamento local.')
      )
    }

    transaction.onabort = () => {
      db.close()
      reject(
        transaction.error ?? new Error('A gravação foi abortada durante o armazenamento local.')
      )
    }
  })
}

export const getRecordingBlob = async (id: string): Promise<Blob | null> => {
  const db = await openAudioDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE_NAME, 'readonly')
    const store = transaction.objectStore(AUDIO_STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      const record = request.result as StoredRecordingBlob | undefined
      resolve(record?.blob ?? null)
    }

    request.onerror = () =>
      reject(request.error ?? new Error('Falha ao carregar a gravação do armazenamento local.'))

    transaction.oncomplete = () => {
      db.close()
    }

    transaction.onerror = () => {
      db.close()
      reject(
        transaction.error ?? new Error('Falha ao concluir a leitura da gravação no armazenamento local.')
      )
    }

    transaction.onabort = () => {
      db.close()
      reject(
        transaction.error ??
          new Error('A leitura da gravação foi abortada no armazenamento local.')
      )
    }
  })
}

export const deleteRecordingBlob = async (id: string): Promise<void> => {
  const db = await openAudioDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(AUDIO_STORE_NAME)
    store.delete(id)

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }

    transaction.onerror = () => {
      db.close()
      reject(
        transaction.error ?? new Error('Falha ao remover a gravação do armazenamento local.')
      )
    }

    transaction.onabort = () => {
      db.close()
      reject(
        transaction.error ?? new Error('A remoção da gravação foi abortada no armazenamento local.')
      )
    }
  })
}
