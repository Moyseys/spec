import { ipcMain, BrowserWindow } from 'electron'
import type { IpcResponse, OllamaModel, OllamaStatus } from '../../shared/ipc-channels'
import { IPC } from '../../shared/ipc-channels'
import {
  checkOllamaStatus,
  listOllamaModels,
  sendChatMessage,
  OllamaChatResponse,
} from '../services/ollama'
import {
  errorMessageFromUnknown,
  fail,
  logIpcError,
  ok,
  parseModelName,
  parseOllamaMessages,
} from './utils'

let currentStream: AbortController | null = null

export function registerOllamaHandlers(): void {
  ipcMain.handle(IPC.OLLAMA_CHECK_STATUS, async (): Promise<IpcResponse<OllamaStatus>> => {
    try {
      const status = await checkOllamaStatus()
      return ok(status)
    } catch (err) {
      logIpcError('ollama:checkStatus', err)
      return fail(errorMessageFromUnknown(err, 'Erro ao verificar Ollama'))
    }
  })

  ipcMain.handle(IPC.OLLAMA_LIST_MODELS, async (): Promise<IpcResponse<OllamaModel[]>> => {
    try {
      const models = await listOllamaModels()
      return ok(models)
    } catch (err) {
      logIpcError('ollama:listModels', err)
      return fail(errorMessageFromUnknown(err, 'Erro ao listar modelos'))
    }
  })

  ipcMain.handle(
    IPC.OLLAMA_SEND_MESSAGE,
    async (event, messagesPayload: unknown, modelPayload: unknown): Promise<IpcResponse<string>> => {
      const parsedMessages = parseOllamaMessages(messagesPayload)
      if (!parsedMessages.ok) {
        return fail(parsedMessages.error)
      }

      const parsedModel = parseModelName(modelPayload)
      if (!parsedModel.ok) {
        return fail(parsedModel.error)
      }

      try {
        const streamController = new AbortController()
        currentStream = streamController

        const response = await sendChatMessage(
          parsedMessages.value,
          parsedModel.value,
          true,
          streamController.signal
        )
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          return fail('O Ollama não disponibilizou um stream de resposta.')
        }

        const window = BrowserWindow.fromWebContents(event.sender)
        if (!window) {
          return fail('Janela principal indisponível para receber a resposta.')
        }

        let fullResponse = ''
        let pendingStreamLine = ''

        const processStreamLine = (line: string): boolean => {
          const trimmedLine = line.trim()
          if (!trimmedLine) {
            return false
          }

          const data: OllamaChatResponse = JSON.parse(trimmedLine)

          if (data.message?.content) {
            fullResponse += data.message.content
            window.webContents.send(IPC.AI_STREAM_CHUNK, data.message.content)
          }

          return Boolean(data.done)
        }

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          pendingStreamLine += decoder.decode(value, { stream: true })
          const lines = pendingStreamLine.split('\n')
          pendingStreamLine = lines.pop() || ''

          for (const line of lines) {
            try {
              if (processStreamLine(line)) {
                return ok(fullResponse)
              }
            } catch (parseErr) {
              logIpcError('ollama:sendMessage:parseChunk', parseErr)
              return fail('Falha ao interpretar a resposta em streaming do Ollama.')
            }
          }
        }

        const remainingChunk = pendingStreamLine.trim()
        if (remainingChunk) {
          try {
            if (processStreamLine(remainingChunk)) {
              return ok(fullResponse)
            }
          } catch (parseErr) {
            logIpcError('ollama:sendMessage:parseTrailingChunk', parseErr)
            return fail('Falha ao interpretar a resposta em streaming do Ollama.')
          }
        }

        if (!fullResponse.trim()) {
          return fail('O Ollama não retornou conteúdo para esta solicitação.')
        }

        return ok(fullResponse)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return fail('Geração cancelada.')
        }

        logIpcError('ollama:sendMessage', err)
        return fail(errorMessageFromUnknown(err, 'Não foi possível enviar a mensagem ao Ollama.'))
      } finally {
        currentStream = null
      }
    }
  )

  ipcMain.handle(IPC.OLLAMA_STOP_GENERATION, async (): Promise<IpcResponse<void>> => {
    if (currentStream) {
      currentStream.abort()
      currentStream = null
      return ok(undefined)
    }
    return fail('Nenhuma geração em andamento.')
  })
}
