import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { checkOllamaStatus, listOllamaModels, sendChatMessage, OllamaMessage, OllamaChatResponse } from '../services/ollama'

let currentStream: AbortController | null = null

export function registerOllamaHandlers(): void {
  ipcMain.handle(IPC.OLLAMA_CHECK_STATUS, async () => {
    try {
      const status = await checkOllamaStatus()
      return { success: true, data: status }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao verificar Ollama'
      }
    }
  })

  ipcMain.handle(IPC.OLLAMA_LIST_MODELS, async () => {
    try {
      const models = await listOllamaModels()
      return { success: true, data: models }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao listar modelos'
      }
    }
  })

  ipcMain.handle(IPC.OLLAMA_SEND_MESSAGE, async (event, messages: OllamaMessage[], model: string) => {
    try {
      currentStream = new AbortController()
      
      const response = await sendChatMessage(messages, model, true)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        return { success: false, error: 'No response stream' }
      }

      const window = BrowserWindow.fromWebContents(event.sender)
      if (!window) {
        return { success: false, error: 'Window not found' }
      }

      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data: OllamaChatResponse = JSON.parse(line)
            
            if (data.message?.content) {
              fullResponse += data.message.content
              window.webContents.send(IPC.AI_STREAM_CHUNK, data.message.content)
            }

            if (data.done) {
              return { success: true, data: fullResponse }
            }
          } catch (parseErr) {
            console.error('Error parsing NDJSON:', parseErr)
          }
        }
      }

      return { success: true, data: fullResponse }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, error: 'Geração cancelada' }
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      }
    } finally {
      currentStream = null
    }
  })

  ipcMain.handle(IPC.OLLAMA_STOP_GENERATION, async () => {
    if (currentStream) {
      currentStream.abort()
      currentStream = null
      return { success: true }
    }
    return { success: false, error: 'Nenhuma geração em andamento' }
  })
}
