import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  ConfirmDialog,
  Toaster,
  TooltipProvider,
  toast,
} from './components/ui'
import { scaleIn } from './utils/motionPresets'
import Settings from './components/Settings'
import { CommandPalette } from './components/CommandPalette'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { AppSidebar } from './app-shell/components/AppSidebar'
import { ChatSection } from './app-shell/components/ChatSection'
import { RecordingsSection } from './app-shell/components/RecordingsSection'
import { SectionHeader } from './app-shell/components/SectionHeader'
import { SettingsPlaceholderSection } from './app-shell/components/SettingsPlaceholderSection'
import { SummaryPlaceholderSection } from './app-shell/components/SummaryPlaceholderSection'
import {
  MAX_CONTEXT_MESSAGES,
  SIDEBAR_ITEMS,
} from './app-shell/constants'
import { useAudioRecorder } from './app-shell/hooks/useAudioRecorder'
import { useRecordingPersistence } from './app-shell/hooks/useRecordingPersistence'
import { useRecordingPlayback } from './app-shell/hooks/useRecordingPlayback'
import { useRecordingSummary } from './app-shell/hooks/useRecordingSummary'
import { useRecordingTranscription } from './app-shell/hooks/useRecordingTranscription'
import type {
  AppSection,
  ChatMessage,
  Message,
} from './app-shell/types'
import { STORE_SETTING_KEYS } from '@shared/ipc-channels'

const App: React.FC = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ollamaModel, setOllamaModel] = useState<string>('llama2')
  const [activeSection, setActiveSection] = useState<AppSection>('chat')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const activePlaybackIdRef = useRef<string | null>(null)
  const stopActivePlaybackRef = useRef<() => void>(() => {})
  const transcribingRecordingIdRef = useRef<string | null>(null)
  const summarizingRecordingIdRef = useRef<string | null>(null)
  const clearTranscriptionStateRef = useRef<(recordingId: string) => void>(() => {})
  const clearSummaryStateRef = useRef<(recordingId: string) => void>(() => {})

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  const handleRecordingDeleted = useCallback((recordingId: string) => {
    if (activePlaybackIdRef.current === recordingId) {
      stopActivePlaybackRef.current()
    }

    clearTranscriptionStateRef.current(recordingId)
    clearSummaryStateRef.current(recordingId)
  }, [])

  const {
    recordings,
    isRecordingsLoading,
    recordingPendingDelete,
    isDeletingRecording,
    lastRecording,
    loadRecordings,
    updateRecordings,
    handleRecordingCaptured,
    confirmDeleteRecording,
    dismissDeleteRecording,
    deletePendingRecording,
  } = useRecordingPersistence({
    onRecordingDeleted: handleRecordingDeleted,
  })

  const {
    activeAudioUrl,
    activePlaybackId,
    playRecording,
    stopActivePlayback,
  } = useRecordingPlayback(recordings)

  useEffect(() => {
    activePlaybackIdRef.current = activePlaybackId
  }, [activePlaybackId])

  useEffect(() => {
    stopActivePlaybackRef.current = stopActivePlayback
  }, [stopActivePlayback])

  const {
    transcribingRecordingId,
    recordingTranscriptionErrors,
    transcribeRecording,
    clearRecordingTranscriptionState,
  } = useRecordingTranscription({
    recordings,
    isSummaryBusy: () => summarizingRecordingIdRef.current !== null,
    updateRecordings,
  })

  const {
    summarizingRecordingId,
    recordingSummaryErrors,
    expandedSummaries,
    toggleSummaryExpanded,
    generateSummary,
    clearRecordingSummaryState,
  } = useRecordingSummary({
    recordings,
    ollamaModel,
    isStreaming,
    isTranscriptionBusy: () => transcribingRecordingIdRef.current !== null,
    updateRecordings,
    onSummaryGenerationStart: () => {
      setStreamingContent('')
    },
    onSummaryGenerationEnd: () => {
      setStreamingContent('')
    },
  })

  useEffect(() => {
    transcribingRecordingIdRef.current = transcribingRecordingId
  }, [transcribingRecordingId])

  useEffect(() => {
    summarizingRecordingIdRef.current = summarizingRecordingId
  }, [summarizingRecordingId])

  useEffect(() => {
    clearTranscriptionStateRef.current = clearRecordingTranscriptionState
  }, [clearRecordingTranscriptionState])

  useEffect(() => {
    clearSummaryStateRef.current = clearRecordingSummaryState
  }, [clearRecordingSummaryState])

  const {
    recordingStatus,
    recordingElapsedMs,
    audioCaptureError,
    isPreparingRecording,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useAudioRecorder({
    selectedAudioDeviceId,
    isStreaming,
    onRecordingCaptured: handleRecordingCaptured,
  })

  const activeSidebarItem =
    SIDEBAR_ITEMS.find((item) => item.id === activeSection) ?? SIDEBAR_ITEMS[0]

  const loadSettings = useCallback(async () => {
    try {
      const [modelResult, audioDeviceResult] = await Promise.all([
        window.ghost.getSetting(STORE_SETTING_KEYS.OLLAMA_MODEL),
        window.ghost.getSetting(STORE_SETTING_KEYS.AUDIO_DEVICE_ID),
      ])

      if (!mountedRef.current) {
        return
      }

      if (modelResult.success && modelResult.data) {
        setOllamaModel(modelResult.data)
      }

      const audioDeviceId =
        audioDeviceResult.success ? audioDeviceResult.data : undefined
      if (typeof audioDeviceId === 'string') {
        setSelectedAudioDeviceId(audioDeviceId)
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      if (mountedRef.current) {
        toast.error('Não foi possível carregar as configurações do aplicativo.')
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    void loadSettings()
    void loadRecordings()

    const cleanup = window.ghost.onStreamChunk((chunk: string) => {
      setStreamingContent((previous) => previous + chunk)
    })

    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [loadRecordings, loadSettings])

  useEffect(() => {
    if (!showSettings) {
      void loadSettings()
    }
  }, [loadSettings, showSettings])

  const goToSection = (section: AppSection) => {
    setActiveSection(section)
    setShowCommandPalette(false)
  }

  const handleSend = async () => {
    if (!input.trim() || isStreaming || summarizingRecordingId !== null) {
      if (summarizingRecordingId !== null) {
        toast.error('Aguarde a geração do resumo terminar para enviar outra mensagem ao Ollama.')
      }
      return
    }

    const userMessage = input.trim()
    setInput('')
    setError(null)

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const systemPrompt: ChatMessage = {
        role: 'system',
        content:
          'Você é um assistente IA chamado Ghost. IMPORTANTE: Você DEVE responder APENAS em português brasileiro. Nunca use inglês ou outras línguas. Seja claro, objetivo e prestativo.',
      }

      const contextMessages: ChatMessage[] = [
        systemPrompt,
        ...newMessages.slice(-MAX_CONTEXT_MESSAGES),
      ]

      const response = await window.ghost.ollama.sendMessage(
        contextMessages,
        ollamaModel.trim() || 'llama2'
      )

      if (!response.success) {
        if (response.error.includes('offline') || response.error.includes('Ollama')) {
          const errorMsg = 'Ollama não está rodando. Inicie o Ollama para continuar.'
          setError(errorMsg)
          toast.error(errorMsg)
        } else {
          const errorMsg = response.error || 'Não foi possível concluir a resposta do chat.'
          setError(errorMsg)
          toast.error(errorMsg)
        }
      } else if (response.data) {
        setMessages((previous) => [...previous, { role: 'assistant', content: response.data }])
        setStreamingContent('')
        toast.success('Resposta recebida com sucesso.')
      } else {
        const errorMsg = 'Não foi possível concluir a resposta do chat.'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error('Error sending message:', err)
      const errorMsg = 'Não foi possível enviar a mensagem.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const clearHistory = () => {
    setMessages([])
    setError(null)
    toast.success('Conversa limpa com sucesso.')
  }

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
    } catch (err) {
      console.error('Clipboard error:', err)
      toast.error('Não foi possível copiar para a área de transferência')
    }
  }

  const copyLastResponse = async () => {
    const lastAssistant = messages.filter((message) => message.role === 'assistant').pop()
    if (lastAssistant) {
      await copyToClipboard(lastAssistant.content, 'Resposta copiada!')
    } else {
      toast.error('Nenhuma resposta para copiar')
    }
  }

  const exportChat = async () => {
    const text = messages
      .map((message) => `${message.role === 'user' ? 'VOCÊ' : 'GHOST'}: ${message.content}`)
      .join('\n\n')
    await copyToClipboard(text, 'Conversa copiada!')
  }

  const handleCommand = (command: string) => {
    switch (command) {
      case 'new-conversation':
        if (messages.length > 0) {
          setShowClearConfirm(true)
        }
        break
      case 'clear-history':
        setShowClearConfirm(true)
        break
      case 'settings':
        goToSection('settings')
        break
      case 'copy-last':
        void copyLastResponse()
        break
      case 'export-chat':
        void exportChat()
        break
      case 'hide-window':
        window.ghost.hideWindow()
        break
      case 'minimize':
        window.ghost.hideWindow()
        break
      case 'quit':
        window.close()
        break
      case 'shortcuts':
        toast.info('Use Cmd/Ctrl+1..4 ou Alt+1..4 para navegar nas seções')
        break
      default:
        toast.error('Comando desconhecido')
    }
  }

  useKeyboardShortcuts({
    'cmd+k': () => setShowCommandPalette(true),
    'cmd+n': () => {
      if (messages.length > 0) {
        setShowClearConfirm(true)
      }
    },
    'cmd+,': () => setShowSettings(true),
    'cmd+/': () => handleCommand('shortcuts'),
    'ctrl+/': () => handleCommand('shortcuts'),
    'cmd+1': () => goToSection('chat'),
    'ctrl+1': () => goToSection('chat'),
    'alt+1': () => goToSection('chat'),
    'cmd+2': () => goToSection('recordings'),
    'ctrl+2': () => goToSection('recordings'),
    'alt+2': () => goToSection('recordings'),
    'cmd+3': () => goToSection('summary'),
    'ctrl+3': () => goToSection('summary'),
    'alt+3': () => goToSection('summary'),
    'cmd+4': () => goToSection('settings'),
    'ctrl+4': () => goToSection('settings'),
    'alt+4': () => goToSection('settings'),
    escape: () => {
      if (showCommandPalette) setShowCommandPalette(false)
      else if (showSettings) setShowSettings(false)
      else if (showClearConfirm) setShowClearConfirm(false)
      else if (recordingPendingDelete) dismissDeleteRecording()
      else if (activeSection !== 'chat') goToSection('chat')
      else window.ghost.hideWindow()
    },
  })

  return (
    <TooltipProvider>
      <div className="w-screen h-screen flex items-center justify-center bg-black p-6">
        <Toaster />
        <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
        <CommandPalette
          open={showCommandPalette}
          onOpenChange={setShowCommandPalette}
          onCommand={handleCommand}
        />
        <ConfirmDialog
          open={showClearConfirm}
          onOpenChange={setShowClearConfirm}
          title="Limpar conversa?"
          description="Todas as mensagens serão apagadas. Esta ação não pode ser desfeita."
          confirmText="Limpar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={clearHistory}
        />
        <ConfirmDialog
          open={!!recordingPendingDelete}
          onOpenChange={(open) => {
            if (!open) {
              dismissDeleteRecording()
            }
          }}
          title="Excluir gravação?"
          description="Essa gravação será removida permanentemente do armazenamento local."
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
          loading={isDeletingRecording}
          onConfirm={() => void deletePendingRecording()}
        />

        <motion.div
          initial="initial"
          animate="animate"
          variants={scaleIn}
          className="w-full max-w-5xl h-[720px]"
        >
          <Card variant="glass" className="h-full flex overflow-hidden">
            <AppSidebar
              activeSection={activeSection}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleCollapsed={() => setIsSidebarCollapsed((previous) => !previous)}
              onSelectSection={goToSection}
            />

            <div className="flex-1 min-w-0 flex flex-col">
              {activeSection === 'chat' ? (
                <ChatSection
                  ollamaModel={ollamaModel}
                  messages={messages}
                  error={error}
                  isStreaming={isStreaming}
                  streamingContent={streamingContent}
                  messagesEndRef={messagesEndRef}
                  input={input}
                  onInputChange={setInput}
                  onInputKeyDown={handleKeyDown}
                  onSend={() => void handleSend()}
                  onOpenClearConfirm={() => setShowClearConfirm(true)}
                  onOpenCommandPalette={() => setShowCommandPalette(true)}
                  onOpenSettings={() => setShowSettings(true)}
                  onHideWindow={() => window.ghost.hideWindow()}
                  recordingStatus={recordingStatus}
                  recordingElapsedMs={recordingElapsedMs}
                  isPreparingRecording={isPreparingRecording}
                  lastRecording={lastRecording}
                  audioCaptureError={audioCaptureError}
                  onStartRecording={startRecording}
                  onPauseRecording={pauseRecording}
                  onResumeRecording={resumeRecording}
                  onStopRecording={stopRecording}
                />
              ) : (
                <>
                  <SectionHeader item={activeSidebarItem} />

                  <Card.Content className="flex-1 overflow-y-auto scrollbar-thin">
                    {activeSection === 'recordings' ? (
                      <RecordingsSection
                        recordings={recordings}
                        isRecordingsLoading={isRecordingsLoading}
                        activePlaybackId={activePlaybackId}
                        activeAudioUrl={activeAudioUrl}
                        transcribingRecordingId={transcribingRecordingId}
                        recordingTranscriptionErrors={recordingTranscriptionErrors}
                        summarizingRecordingId={summarizingRecordingId}
                        recordingSummaryErrors={recordingSummaryErrors}
                        expandedSummaries={expandedSummaries}
                        isDeletingRecording={isDeletingRecording}
                        onPlayRecording={playRecording}
                        onTranscribeRecording={transcribeRecording}
                        onGenerateSummary={generateSummary}
                        onConfirmDeleteRecording={confirmDeleteRecording}
                        onToggleSummaryExpanded={toggleSummaryExpanded}
                        onStopActivePlayback={stopActivePlayback}
                      />
                    ) : activeSection === 'summary' ? (
                      <SummaryPlaceholderSection />
                    ) : (
                      <SettingsPlaceholderSection onOpenSettings={() => setShowSettings(true)} />
                    )}
                  </Card.Content>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}

export default App
