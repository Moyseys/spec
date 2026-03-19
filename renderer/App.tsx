import React, { useEffect, useState, useRef } from 'react'
import Settings from './components/Settings'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const MAX_CONTEXT_MESSAGES = 20

const App: React.FC = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ollamaModel, setOllamaModel] = useState<string>('llama2')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  useEffect(() => {
    loadSettings()
    
    const cleanup = window.ghost.onStreamChunk((chunk: string) => {
      setStreamingContent(prev => prev + chunk)
    })

    return cleanup
  }, [])

  const loadSettings = async () => {
    const modelResult = await window.ghost.getSetting('ollamaModel')
    if (modelResult.success && modelResult.data) {
      setOllamaModel(modelResult.data)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsStreaming(true)
    setStreamingContent('')

    try {
      // System prompt forte para português
      const systemPrompt: Message = {
        role: 'system',
        content: 'Você é um assistente IA chamado Ghost. IMPORTANTE: Você DEVE responder APENAS em português brasileiro. Nunca use inglês ou outras línguas. Seja claro, objetivo e prestativo.'
      }
      
      const contextMessages = [systemPrompt, ...newMessages.slice(-MAX_CONTEXT_MESSAGES)]
      
      const response = await window.ghost.ollama.sendMessage(contextMessages, ollamaModel)
      
      if (response.success && response.data) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data! }])
        setStreamingContent('')
      } else {
        if (response.error?.includes('offline') || response.error?.includes('Ollama')) {
          setError('Ollama não está rodando. Inicie o Ollama para continuar.')
        } else {
          setError(response.error || 'Erro desconhecido')
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Erro ao enviar mensagem')
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearHistory = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-transparent p-4">
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      
      <div className="w-full max-w-3xl h-[680px] bg-black/60 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <div className="relative px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium text-base text-white tracking-tight">
                  Ghost
                </span>
              </div>
              {ollamaModel && (
                <span className="text-xs text-zinc-400 px-2 py-1 bg-white/5 rounded-md border border-white/10">
                  {ollamaModel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
                  title="Limpar conversa"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button 
                onClick={() => setShowSettings(true)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                onClick={() => window.ghost.hideWindow()}
                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Como posso ajudar?</h3>
                <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
                  Faça uma pergunta ou comece uma conversa.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {msg.role === 'user' ? 'Você' : 'Ghost'}
                </div>
                <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'text-white' : 'text-zinc-300'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isStreaming && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Ghost
                </div>
                {streamingContent ? (
                  <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                    {streamingContent}
                    <span className="inline-block w-1 h-4 bg-white/60 ml-0.5 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs">Pensando...</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div ref={messagesEndRef} />
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/5">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                autoFocus
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem..."
                disabled={isStreaming}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:bg-white/10 disabled:opacity-50 resize-none transition-all min-h-[44px] max-h-32"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="h-11 w-11 rounded-lg bg-white hover:bg-white/90 disabled:bg-white/20 disabled:cursor-not-allowed text-black disabled:text-zinc-600 flex items-center justify-center transition-all duration-150 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
