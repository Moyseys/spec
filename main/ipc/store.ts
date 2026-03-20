import { ipcMain } from 'electron'
import type { IpcResponse, StoreSettingValue } from '../../shared/ipc-channels'
import { IPC } from '../../shared/ipc-channels'
import {
  getConfig,
  setConfig,
  setAPIKey,
  getAPIKey,
  hasAPIKey,
  clearAPIKeys,
  validateAPIKeyFormat,
} from '../store'
import {
  errorMessageFromUnknown,
  fail,
  logIpcError,
  ok,
  parseApiKey,
  parseApiProvider,
  parseStoreKey,
  parseStoreValue,
} from './utils'

export function registerStoreHandlers(): void {
  ipcMain.handle(IPC.STORE_GET, (_event, keyPayload: unknown): IpcResponse<StoreSettingValue> => {
    const parsedKey = parseStoreKey(keyPayload)
    if (!parsedKey.ok) {
      return fail(parsedKey.error)
    }

    try {
      return ok(getConfig(parsedKey.value))
    } catch (err) {
      logIpcError(`store:get:${parsedKey.value}`, err)
      return fail(errorMessageFromUnknown(err, 'Falha ao carregar configuração.'))
    }
  })

  ipcMain.handle(
    IPC.STORE_SET,
    (_event, keyPayload: unknown, valuePayload: unknown): IpcResponse<void> => {
      const parsedKey = parseStoreKey(keyPayload)
      if (!parsedKey.ok) {
        return fail(parsedKey.error)
      }

      const parsedValue = parseStoreValue(parsedKey.value, valuePayload)
      if (!parsedValue.ok) {
        return fail(parsedValue.error)
      }

      try {
        setConfig(parsedKey.value, parsedValue.value)
        return ok(undefined)
      } catch (err) {
        logIpcError(`store:set:${parsedKey.value}`, err)
        return fail(errorMessageFromUnknown(err, 'Falha ao salvar configuração.'))
      }
    }
  )

  ipcMain.handle(
    IPC.STORE_SET_API_KEY,
    (_event, providerPayload: unknown, keyPayload: unknown): IpcResponse<void> => {
      const parsedProvider = parseApiProvider(providerPayload)
      if (!parsedProvider.ok) {
        return fail(parsedProvider.error)
      }

      const parsedKey = parseApiKey(keyPayload)
      if (!parsedKey.ok) {
        return fail(parsedKey.error)
      }

      const validation = validateAPIKeyFormat(parsedProvider.value, parsedKey.value)
      if (!validation.valid) {
        return fail(validation.error || 'Formato de API key inválido.')
      }

      const result = setAPIKey(parsedProvider.value, parsedKey.value)
      return result.success ? ok(undefined) : fail(result.error || 'Falha ao salvar API key.')
    }
  )

  ipcMain.handle(
    IPC.STORE_GET_API_KEY,
    (_event, providerPayload: unknown): IpcResponse<string | undefined> => {
      const parsedProvider = parseApiProvider(providerPayload)
      if (!parsedProvider.ok) {
        return fail(parsedProvider.error)
      }

      try {
        const key = getAPIKey(parsedProvider.value)
        return ok(key)
      } catch (err) {
        logIpcError(`store:getApiKey:${parsedProvider.value}`, err)
        return fail(errorMessageFromUnknown(err, 'Falha ao carregar API key.'))
      }
    }
  )

  ipcMain.handle(
    IPC.STORE_HAS_API_KEY,
    (_event, providerPayload: unknown): IpcResponse<boolean> => {
      const parsedProvider = parseApiProvider(providerPayload)
      if (!parsedProvider.ok) {
        return fail(parsedProvider.error)
      }

      try {
        const has = hasAPIKey(parsedProvider.value)
        return ok(has)
      } catch (err) {
        logIpcError(`store:hasApiKey:${parsedProvider.value}`, err)
        return fail(errorMessageFromUnknown(err, 'Falha ao verificar API key.'))
      }
    }
  )

  ipcMain.handle(IPC.STORE_CLEAR_API_KEYS, (): IpcResponse<void> => {
    try {
      clearAPIKeys()
      return ok(undefined)
    } catch (err) {
      logIpcError('store:clearApiKeys', err)
      return fail(errorMessageFromUnknown(err, 'Falha ao limpar API keys.'))
    }
  })

  console.log('Store IPC handlers registered')
}
