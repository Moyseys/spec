import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Pause, Play, Square } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  MessageBubble,
  Tooltip,
  TypingIndicator,
} from '../../components/ui'
import { cn } from '../../utils/cn'
import type { Message, RecordedAudio, RecordingStatus } from '../types'
import { formatElapsedTime, formatFileSize } from '../utils/formatters'

interface ChatSectionProps {
  ollamaModel: string
  messages: Message[]
  error: string | null
  isStreaming: boolean
  streamingContent: string
  messagesEndRef: React.RefObject<HTMLDivElement>
  input: string
  onInputChange: (value: string) => void
  onInputKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onOpenClearConfirm: () => void
  onOpenCommandPalette: () => void
  onOpenSettings: () => void
  onHideWindow: () => void
  recordingStatus: RecordingStatus
  recordingElapsedMs: number
  isPreparingRecording: boolean
  lastRecording: RecordedAudio | null
  audioCaptureError: string | null
  onStartRecording: () => Promise<void>
  onPauseRecording: () => void
  onResumeRecording: () => void
  onStopRecording: () => void
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  ollamaModel,
  messages,
  error,
  isStreaming,
  streamingContent,
  messagesEndRef,
  input,
  onInputChange,
  onInputKeyDown,
  onSend,
  onOpenClearConfirm,
  onOpenCommandPalette,
  onOpenSettings,
  onHideWindow,
  recordingStatus,
  recordingElapsedMs,
  isPreparingRecording,
  lastRecording,
  audioCaptureError,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
}) => (
  <>
    <Card.Header className="border-b border-white/[0.06]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-semibold text-lg text-white tracking-tight">Ghost</span>
          </div>
          {ollamaModel && (
            <Badge variant="default" size="sm">
              {ollamaModel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <Tooltip content="Limpar conversa (Cmd+N)">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenClearConfirm}
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                }
                className="w-8 h-8 p-0"
              />
            </Tooltip>
          )}
          <Tooltip content="Comando rápido (Cmd+K)">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenCommandPalette}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              className="w-8 h-8 p-0"
            />
          </Tooltip>
          <Tooltip content="Configurações (Cmd+,)">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              className="w-8 h-8 p-0"
            />
          </Tooltip>
          <Tooltip content="Esconder (Esc)">
            <Button
              variant="ghost"
              size="sm"
              onClick={onHideWindow}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              className="w-8 h-8 p-0"
            />
          </Tooltip>
        </div>
      </div>
    </Card.Header>

    <Card.Content className="flex-1 overflow-y-auto scrollbar-thin">
      <AnimatePresence mode="popLayout">
        {messages.length === 0 && !error && (
          <EmptyState
            title="Como posso ajudar?"
            description="Faça uma pergunta ou comece uma conversa com o Ghost. Pressione Cmd+K para ver comandos."
          />
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Badge variant="error" className="w-full justify-center py-3">
              {error}
            </Badge>
          </motion.div>
        )}

        <div className="space-y-6">
          {messages.map((message, index) => (
            <MessageBubble key={index} role={message.role} content={message.content} />
          ))}

          {isStreaming && streamingContent && (
            <MessageBubble role="assistant" content={streamingContent} isStreaming={true} />
          )}

          {isStreaming && !streamingContent && <TypingIndicator />}
        </div>
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </Card.Content>

    <Card.Footer className="border-t border-white/[0.06] space-y-3">
      {recordingStatus !== 'idle' && (
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2',
            recordingStatus === 'recording' ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/30 bg-amber-500/10'
          )}
        >
          <span
            className={cn(
              'inline-flex h-2 w-2 rounded-full',
              recordingStatus === 'recording' ? 'bg-red-400 animate-pulse' : 'bg-amber-400'
            )}
          />
          <span
            className={cn(
              'text-xs font-medium',
              recordingStatus === 'recording' ? 'text-red-300' : 'text-amber-300'
            )}
          >
            {recordingStatus === 'recording' ? 'Gravando áudio' : 'Gravação pausada'}
          </span>
          <Badge variant={recordingStatus === 'recording' ? 'error' : 'warning'} size="sm">
            {formatElapsedTime(recordingElapsedMs)}
          </Badge>
          {isPreparingRecording && <span className="text-xs text-zinc-300">Finalizando...</span>}
        </div>
      )}

      {lastRecording && recordingStatus === 'idle' && (
        <Badge variant="success" className="w-full justify-center py-2">
          Gravação pronta • {formatFileSize(lastRecording.size)} • {formatElapsedTime(lastRecording.durationMs)}
        </Badge>
      )}

      {audioCaptureError && recordingStatus === 'idle' && (
        <Badge variant="error" className="w-full justify-center py-2">
          {audioCaptureError}
        </Badge>
      )}

      <div className="flex items-end gap-3">
        <div className="flex shrink-0 flex-wrap items-center gap-2 pb-0.5">
          <Tooltip content="Iniciar gravação">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void onStartRecording()}
              disabled={recordingStatus !== 'idle' || isPreparingRecording || isStreaming}
              icon={<Mic className="h-4 w-4" />}
            >
              Gravar
            </Button>
          </Tooltip>

          {recordingStatus === 'recording' && (
            <Tooltip content="Pausar gravação">
              <Button
                variant="secondary"
                size="sm"
                onClick={onPauseRecording}
                disabled={isPreparingRecording}
                icon={<Pause className="h-4 w-4" />}
              >
                Pausar
              </Button>
            </Tooltip>
          )}

          {recordingStatus === 'paused' && (
            <Tooltip content="Retomar gravação">
              <Button
                variant="secondary"
                size="sm"
                onClick={onResumeRecording}
                disabled={isPreparingRecording}
                icon={<Play className="h-4 w-4" />}
              >
                Retomar
              </Button>
            </Tooltip>
          )}

          {recordingStatus !== 'idle' && (
            <Tooltip content="Parar gravação">
              <Button
                variant="danger"
                size="sm"
                onClick={onStopRecording}
                disabled={isPreparingRecording}
                icon={<Square className="h-3.5 w-3.5" />}
              >
                Parar
              </Button>
            </Tooltip>
          )}
        </div>

        <div className="flex-1 relative">
          <textarea
            autoFocus
            rows={1}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Mensagem... (Shift+Enter para nova linha)"
            disabled={isStreaming}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] disabled:opacity-50 resize-none transition-all min-h-[44px] max-h-32"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
        </div>
        <Tooltip content={isStreaming ? 'Enviando...' : 'Enviar (Enter)'}>
          <Button
            variant="primary"
            onClick={onSend}
            disabled={!input.trim() || isStreaming}
            loading={isStreaming}
            className="h-11 w-11 p-0"
            icon={
              !isStreaming && (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )
            }
          >
            {!isStreaming && ''}
          </Button>
        </Tooltip>
      </div>
    </Card.Footer>
  </>
)
