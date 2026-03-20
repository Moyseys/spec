import type React from 'react'
import { Mic, Play, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Tooltip } from '../ui'
import { cn } from '../../utils/cn'
import { formatElapsedTime, formatFileSize, formatRecordingDateTime } from '../../utils/formatters'
import type { RecordingMetadata } from '../../types/app'

export interface RecordingsSectionProps {
  recordings: RecordingMetadata[]
  isRecordingsLoading: boolean
  activePlaybackId: string | null
  activeAudioUrl: string | null
  transcribingRecordingId: string | null
  recordingTranscriptionErrors: Record<string, string>
  summarizingRecordingId: string | null
  recordingSummaryErrors: Record<string, string>
  expandedSummaries: Record<string, boolean>
  isDeletingRecording: boolean
  onPlayRecording: (recording: RecordingMetadata) => Promise<void>
  onTranscribeRecording: (recording: RecordingMetadata) => Promise<void>
  onGenerateSummary: (recording: RecordingMetadata) => Promise<void>
  onConfirmDeleteRecording: (recording: RecordingMetadata) => void
  onToggleSummaryExpanded: (recordingId: string) => void
  onStopActivePlayback: () => void
}

export const RecordingsSection: React.FC<RecordingsSectionProps> = ({
  recordings,
  isRecordingsLoading,
  activePlaybackId,
  activeAudioUrl,
  transcribingRecordingId,
  recordingTranscriptionErrors,
  summarizingRecordingId,
  recordingSummaryErrors,
  expandedSummaries,
  isDeletingRecording,
  onPlayRecording,
  onTranscribeRecording,
  onGenerateSummary,
  onConfirmDeleteRecording,
  onToggleSummaryExpanded,
  onStopActivePlayback,
}) => {
  return (
    <div className="h-full space-y-4">
      <Card variant="default" className="bg-white/[0.02] border-white/[0.08]">
        <Card.Content className="space-y-2 py-5">
          <h3 className="text-base font-semibold text-white">Centro de gravações</h3>
          <p className="text-sm leading-relaxed text-zinc-400">
            Aqui ficam suas gravações salvas localmente. Use o player para revisar e remova itens
            quando não precisar mais.
          </p>
        </Card.Content>
      </Card>

      <Card variant="default" className="bg-white/[0.02] border-white/[0.08] min-h-[380px]">
        <Card.Content className="h-full">
          {isRecordingsLoading ? (
            <div className="h-full flex items-center justify-center">
              <Badge variant="default" className="px-3 py-1.5">
                Carregando gravações...
              </Badge>
            </div>
          ) : recordings.length === 0 ? (
            <EmptyState
              title="Nenhuma gravação disponível"
              description="Grave um áudio no chat para vê-lo aqui. As gravações ficam salvas localmente no dispositivo."
              icon={<Mic className="w-10 h-10 text-white" />}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                  {recordings.length}{' '}
                  {recordings.length === 1 ? 'gravação salva' : 'gravações salvas'}
                </p>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {recordings.map((recording) => {
                  const isPlayingEntry = activePlaybackId === recording.id
                  const isTranscribingEntry = transcribingRecordingId === recording.id
                  const isSummarizingEntry = summarizingRecordingId === recording.id
                  const transcriptionError = recordingTranscriptionErrors[recording.id]
                  const summaryError = recordingSummaryErrors[recording.id]
                  const hasTranscript = Boolean(recording.transcript?.trim())
                  const hasSummary = Boolean(recording.summary?.trim())
                  const isSummaryExpanded = Boolean(expandedSummaries[recording.id])
                  const canToggleSummaryView = (recording.summary?.length ?? 0) > 360
                  const shouldClampSummary = hasSummary && canToggleSummaryView && !isSummaryExpanded
                  const summaryButtonLabel = hasSummary ? 'Atualizar resumo' : 'Gerar resumo'
                  const summaryDisabledMessage =
                    'Transcreva o áudio para habilitar o resumo automático.'
                  const disableTranscriptionAction =
                    (transcribingRecordingId !== null && transcribingRecordingId !== recording.id) ||
                    summarizingRecordingId !== null ||
                    isDeletingRecording
                  const disableSummaryAction =
                    !hasTranscript ||
                    isDeletingRecording ||
                    (summarizingRecordingId !== null &&
                      summarizingRecordingId !== recording.id) ||
                    transcribingRecordingId !== null

                  return (
                    <Card
                      key={recording.id}
                      variant="default"
                      className="bg-white/[0.02] border-white/[0.08]"
                    >
                      <Card.Content className="space-y-3 py-4 overflow-visible">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium text-white truncate">
                              {recording.title ?? `Gravação ${formatRecordingDateTime(recording.createdAt)}`}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {formatRecordingDateTime(recording.createdAt)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => void onPlayRecording(recording)}
                              icon={<Play className="h-4 w-4" />}
                            >
                              Ouvir
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => void onTranscribeRecording(recording)}
                              loading={isTranscribingEntry}
                              disabled={disableTranscriptionAction}
                            >
                              {isTranscribingEntry
                                ? 'Transcrevendo...'
                                : recording.transcript
                                  ? 'Retranscrever'
                                  : 'Transcrever'}
                            </Button>
                            {hasTranscript ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => void onGenerateSummary(recording)}
                                loading={isSummarizingEntry}
                                disabled={disableSummaryAction}
                              >
                                {isSummarizingEntry ? 'Gerando resumo...' : summaryButtonLabel}
                              </Button>
                            ) : (
                              <Tooltip content={summaryDisabledMessage}>
                                <span className="inline-flex">
                                  <Button variant="secondary" size="sm" disabled>
                                    {summaryButtonLabel}
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onConfirmDeleteRecording(recording)}
                              icon={<Trash2 className="h-4 w-4 text-red-300" />}
                              className="text-red-300 hover:text-red-200"
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="default" size="sm">
                            {formatElapsedTime(recording.durationMs)}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {formatFileSize(recording.size)}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {recording.mimeType}
                          </Badge>
                        </div>

                        {isTranscribingEntry && (
                          <Badge variant="info" className="w-full justify-center py-2">
                            Processando transcrição com Whisper...
                          </Badge>
                        )}

                        {isSummarizingEntry && (
                          <Badge variant="info" className="w-full justify-center py-2">
                            Gerando resumo com Ollama...
                          </Badge>
                        )}

                        {transcriptionError && (
                          <Badge variant="error" className="w-full justify-center py-2">
                            {transcriptionError}
                          </Badge>
                        )}

                        {summaryError && (
                          <Badge variant="error" className="w-full justify-center py-2">
                            {summaryError}
                          </Badge>
                        )}

                        {!hasTranscript && (
                          <Badge variant="warning" className="w-full justify-center py-2">
                            {summaryDisabledMessage}
                          </Badge>
                        )}

                        {recording.transcript && (
                          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                                Transcrição
                              </p>
                              <Badge variant="default" size="sm">
                                {recording.transcript.split(/\s+/).filter(Boolean).length} palavras
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-1">
                              {recording.transcript}
                            </p>
                          </div>
                        )}

                        {hasSummary && (
                          <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.06] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-[11px] uppercase tracking-[0.12em] text-blue-200/80">
                                Resumo da reunião
                              </p>
                              {canToggleSummaryView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onToggleSummaryExpanded(recording.id)}
                                  className="h-7 px-2 text-xs text-blue-200 hover:text-white"
                                >
                                  {isSummaryExpanded ? 'Recolher' : 'Expandir'}
                                </Button>
                              )}
                            </div>
                            <div className="relative">
                              <p
                                className={cn(
                                  'text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed',
                                  shouldClampSummary && 'max-h-48 overflow-hidden'
                                )}
                              >
                                {recording.summary}
                              </p>
                              {shouldClampSummary && (
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-blue-950/95 to-transparent" />
                              )}
                            </div>
                          </div>
                        )}

                        {isPlayingEntry && activeAudioUrl && (
                          <audio
                            controls
                            autoPlay
                            src={activeAudioUrl}
                            onEnded={onStopActivePlayback}
                            className="w-full h-10"
                          >
                            Seu navegador não suporta reprodução de áudio.
                          </audio>
                        )}
                      </Card.Content>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
