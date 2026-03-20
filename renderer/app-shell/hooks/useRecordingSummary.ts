import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '../../components/ui'
import type { RecordingMetadata } from '../types'
import {
  buildMeetingSummaryMessages,
  getMeetingSummaryErrorMessage,
  normalizeSummaryMarkdown,
} from '../utils/recording'
import type { RecordingsUpdater } from './useRecordingPersistence'

interface UseRecordingSummaryOptions {
  recordings: RecordingMetadata[]
  ollamaModel: string
  isStreaming: boolean
  isTranscriptionBusy: () => boolean
  updateRecordings: (updater: RecordingsUpdater) => Promise<RecordingMetadata[]>
  onSummaryGenerationStart?: () => void
  onSummaryGenerationEnd?: () => void
}

export interface UseRecordingSummaryResult {
  summarizingRecordingId: string | null
  recordingSummaryErrors: Record<string, string>
  expandedSummaries: Record<string, boolean>
  toggleSummaryExpanded: (recordingId: string) => void
  generateSummary: (recording: RecordingMetadata) => Promise<void>
  clearRecordingSummaryState: (recordingId: string) => void
}

export const useRecordingSummary = ({
  recordings,
  ollamaModel,
  isStreaming,
  isTranscriptionBusy,
  updateRecordings,
  onSummaryGenerationStart,
  onSummaryGenerationEnd,
}: UseRecordingSummaryOptions): UseRecordingSummaryResult => {
  const [summarizingRecordingId, setSummarizingRecordingId] = useState<string | null>(null)
  const [recordingSummaryErrors, setRecordingSummaryErrors] = useState<Record<string, string>>({})
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({})

  const mountedRef = useRef(true)

  const toggleSummaryExpanded = useCallback((recordingId: string) => {
    setExpandedSummaries((previousState) => ({
      ...previousState,
      [recordingId]: !previousState[recordingId],
    }))
  }, [])

  const clearRecordingSummaryState = useCallback((recordingId: string) => {
    setSummarizingRecordingId((currentId) => (currentId === recordingId ? null : currentId))

    setRecordingSummaryErrors((previousErrors) => {
      if (!previousErrors[recordingId]) {
        return previousErrors
      }

      const nextErrors = { ...previousErrors }
      delete nextErrors[recordingId]
      return nextErrors
    })

    setExpandedSummaries((previousState) => {
      if (!(recordingId in previousState)) {
        return previousState
      }

      const nextState = { ...previousState }
      delete nextState[recordingId]
      return nextState
    })
  }, [])

  const generateSummary = useCallback(
    async (recording: RecordingMetadata) => {
      if (summarizingRecordingId && summarizingRecordingId !== recording.id) {
        toast.info('Aguarde o resumo em andamento terminar para gerar outro.')
        return
      }

      if (isTranscriptionBusy()) {
        toast.info('Aguarde a transcrição em andamento terminar antes de gerar um resumo.')
        return
      }

      if (isStreaming) {
        toast.error('Aguarde a resposta atual do chat terminar antes de gerar o resumo.')
        return
      }

      const transcript = recording.transcript?.trim()
      if (!transcript) {
        const message = 'Transcreva o áudio para habilitar a geração de resumo.'
        if (mountedRef.current) {
          setRecordingSummaryErrors((previousErrors) => ({
            ...previousErrors,
            [recording.id]: message,
          }))
        }
        toast.error(message)
        return
      }

      setSummarizingRecordingId(recording.id)
      onSummaryGenerationStart?.()
      setRecordingSummaryErrors((previousErrors) => {
        if (!previousErrors[recording.id]) {
          return previousErrors
        }

        const nextErrors = { ...previousErrors }
        delete nextErrors[recording.id]
        return nextErrors
      })

      try {
        const modelName = ollamaModel.trim() || 'llama2'
        const summaryResponse = await window.ghost.ollama.sendMessage(
          buildMeetingSummaryMessages(transcript),
          modelName
        )

        if (!summaryResponse.success) {
          throw new Error(summaryResponse.error)
        }

        if (!summaryResponse.data) {
          throw new Error('O Ollama retornou uma resposta vazia.')
        }

        const summary = normalizeSummaryMarkdown(summaryResponse.data)
        if (!summary) {
          throw new Error('Não foi possível gerar um resumo válido para esta transcrição.')
        }

        const hadSummary = Boolean(recording.summary?.trim())
        await updateRecordings((entries) =>
          entries.map((entry) => (entry.id === recording.id ? { ...entry, summary } : entry))
        )

        if (!mountedRef.current) {
          return
        }

        setExpandedSummaries((previousState) => ({ ...previousState, [recording.id]: true }))
        toast.success(hadSummary ? 'Resumo atualizado com sucesso.' : 'Resumo gerado com sucesso.')
      } catch (err) {
        console.error('Error generating meeting summary:', err)
        const message = getMeetingSummaryErrorMessage(err)

        if (mountedRef.current) {
          setRecordingSummaryErrors((previousErrors) => ({
            ...previousErrors,
            [recording.id]: message,
          }))
        }

        toast.error(message)
      } finally {
        if (mountedRef.current) {
          setSummarizingRecordingId((currentId) =>
            currentId === recording.id ? null : currentId
          )
          onSummaryGenerationEnd?.()
        }
      }
    },
    [
      isStreaming,
      isTranscriptionBusy,
      ollamaModel,
      onSummaryGenerationEnd,
      onSummaryGenerationStart,
      summarizingRecordingId,
      updateRecordings,
    ]
  )

  useEffect(() => {
    if (!summarizingRecordingId) {
      return
    }

    if (recordings.some((recording) => recording.id === summarizingRecordingId)) {
      return
    }

    setSummarizingRecordingId(null)
  }, [recordings, summarizingRecordingId])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    summarizingRecordingId,
    recordingSummaryErrors,
    expandedSummaries,
    toggleSummaryExpanded,
    generateSummary,
    clearRecordingSummaryState,
  }
}
