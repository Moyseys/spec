/**
 * Ollama Service - Cliente para integração com Ollama local
 */
import { net } from 'electron'

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export interface OllamaStatus {
  running: boolean
  version?: string
  models?: OllamaModel[]
  error?: string
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OllamaChatResponse {
  model: string
  created_at: string
  message: OllamaMessage
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  eval_count?: number
}

const OLLAMA_BASE_URL = 'http://localhost:11434'

/**
 * Verifica se Ollama está rodando e retorna status
 */
export async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const response = await net.fetch(`${OLLAMA_BASE_URL}/api/tags`)

    if (!response.ok) {
      return { running: false, error: `Status ${response.status}` }
    }

    const data = await response.json()
    
    return {
      running: true,
      version: data.version,
      models: data.models || []
    }
  } catch (err) {
    return { running: false, error: 'Ollama offline' }
  }
}

export async function listOllamaModels(): Promise<OllamaModel[]> {
  const status = await checkOllamaStatus()
  return status.running && status.models ? status.models : []
}

export async function hasModel(modelName: string): Promise<boolean> {
  const models = await listOllamaModels()
  return models.some(m => m.name === modelName || m.name.startsWith(modelName))
}

/**
 * Envia mensagem para Ollama com contexto (chat)
 * @param messages Array de mensagens (contexto da conversa)
 * @param model Nome do modelo (ex: 'llama2', 'mistral')
 * @param stream Se deve fazer streaming da resposta
 */
export async function sendChatMessage(
  messages: OllamaMessage[],
  model: string = 'llama2',
  stream: boolean = false
): Promise<Response> {
  try {
    const response = await net.fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream
      })
    })

    if (!response.ok) {
      const error = await response.text()
      if (response.status === 404) {
        throw new Error(`Modelo "${model}" não encontrado. Instale com: ollama pull ${model}`)
      }
      throw new Error(`Ollama error: ${response.status} - ${error}`)
    }

    return response
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao Ollama. Certifique-se de que está rodando: ollama serve')
    }
    throw err
  }
}

/**
 * Envia mensagem simples (sem contexto)
 */
export async function sendMessage(
  prompt: string,
  model: string = 'llama2',
  stream: boolean = false
): Promise<Response> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`)
  }

  return response
}
