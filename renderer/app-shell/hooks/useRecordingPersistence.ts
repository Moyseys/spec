import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '../../components/ui'
import { deleteRecordingBlob, saveRecordingBlob } from '../../utils/audioStorage'
import type { RecordedAudio, RecordingMetadata } from '../types'
import { formatElapsedTime, formatFileSize } from '../utils/formatters'
import {
  loadRecordingsMetadata,
  persistRecordingsMetadata,
} from '../services/recordingPersistence'
import type { RecordingCapturedPayload } from './useAudioRecorder'

export type RecordingsUpdater = (current: RecordingMetadata[]) => RecordingMetadata[]

interface UseRecordingPersistenceOptions {
  onRecordingDeleted?: (recordingId: string) => void
}

export interface UseRecordingPersistenceResult {
  recordings: RecordingMetadata[]
  isRecordingsLoading: boolean
  recordingPendingDelete: RecordingMetadata | null
  isDeletingRecording: boolean
  lastRecording: RecordedAudio | null
  loadRecordings: () => Promise<void>
  updateRecordings: (updater: RecordingsUpdater) => Promise<RecordingMetadata[]>
  handleRecordingCaptured: (payload: RecordingCapturedPayload) => Promise<void>
  confirmDeleteRecording: (recording: RecordingMetadata) => void
  dismissDeleteRecording: () => void
  deletePendingRecording: () => Promise<void>
}

export const useRecordingPersistence = ({
  onRecordingDeleted,
}: UseRecordingPersistenceOptions = {}): UseRecordingPersistenceResult => {
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([])
  const [isRecordingsLoading, setIsRecordingsLoading] = useState(true)
  const [recordingPendingDelete, setRecordingPendingDelete] = useState<RecordingMetadata | null>(
    null
  )
  const [isDeletingRecording, setIsDeletingRecording] = useState(false)
  const [lastRecording, setLastRecording] = useState<RecordedAudio | null>(null)

  const mountedRef = useRef(true)
  const recordingsRef = useRef<RecordingMetadata[]>([])

  const applyRecordingsState = useCallback((nextRecordings: RecordingMetadata[]) => {
    recordingsRef.current = nextRecordings

    if (mountedRef.current) {
      setRecordings(nextRecordings)
    }
  }, [])

  const updateRecordings = useCallback(
    async (updater: RecordingsUpdater) => {
      const nextRecordings = updater(recordingsRef.current)
      await persistRecordingsMetadata(nextRecordings)
      applyRecordingsState(nextRecordings)
      return nextRecordings
    },
    [applyRecordingsState]
  )

  const loadRecordings = useCallback(async () => {
    setIsRecordingsLoading(true)

    try {
      const normalizedRecordings = await loadRecordingsMetadata()
      applyRecordingsState(normalizedRecordings)
    } catch (err) {
      console.error('Error loading recordings metadata:', err)
      applyRecordingsState([])
      toast.error('Não foi possível carregar as gravações salvas.')
    } finally {
      if (mountedRef.current) {
        setIsRecordingsLoading(false)
      }
    }
  }, [applyRecordingsState])

  const handleRecordingCaptured = useCallback(
    async ({ recording: nextRecording, blob }: RecordingCapturedPayload): Promise<void> => {
      let blobSaved = false

      try {
        await saveRecordingBlob(nextRecording.id, blob)
        blobSaved = true

        const nextRecordings = [nextRecording, ...recordingsRef.current].sort(
          (a, b) => b.createdAt - a.createdAt
        )
        await persistRecordingsMetadata(nextRecordings)

        if (!mountedRef.current) {
          return
        }

        applyRecordingsState(nextRecordings)
        setLastRecording(nextRecording)
        toast.success(
          `Gravação concluída (${formatFileSize(nextRecording.size)} • ${formatElapsedTime(
            nextRecording.durationMs
          )})`
        )
      } catch (err) {
        if (blobSaved) {
          try {
            await deleteRecordingBlob(nextRecording.id)
          } catch (rollbackError) {
            console.error('Error rolling back recording blob:', rollbackError)
          }
        }

        console.error('Error persisting recording:', err)
        if (err instanceof Error && err.message.includes('IndexedDB')) {
          toast.error('Não foi possível salvar: armazenamento local de áudio indisponível.')
        } else {
          toast.error('Não foi possível salvar a gravação.')
        }
      }
    },
    [applyRecordingsState]
  )

  const confirmDeleteRecording = useCallback((recording: RecordingMetadata) => {
    setRecordingPendingDelete(recording)
  }, [])

  const dismissDeleteRecording = useCallback(() => {
    if (isDeletingRecording) {
      return
    }

    setRecordingPendingDelete(null)
  }, [isDeletingRecording])

  const deletePendingRecording = useCallback(async () => {
    const target = recordingPendingDelete
    if (!target) {
      return
    }

    setIsDeletingRecording(true)

    try {
      const previousRecordings = recordingsRef.current
      const nextRecordings = previousRecordings.filter((recording) => recording.id !== target.id)

      await persistRecordingsMetadata(nextRecordings)

      try {
        await deleteRecordingBlob(target.id)
      } catch (blobError) {
        try {
          await persistRecordingsMetadata(previousRecordings)
        } catch (rollbackError) {
          console.error('Error rolling back recordings metadata:', rollbackError)
        }

        throw blobError
      }

      if (!mountedRef.current) {
        return
      }

      applyRecordingsState(nextRecordings)
      setLastRecording((current) => (current?.id === target.id ? null : current))
      setRecordingPendingDelete(null)
      onRecordingDeleted?.(target.id)
      toast.success('Gravação removida.')
    } catch (err) {
      console.error('Error deleting recording:', err)
      if (err instanceof Error && err.message.includes('IndexedDB')) {
        toast.error('Não foi possível remover: armazenamento local de áudio indisponível.')
      } else {
        toast.error('Não foi possível remover a gravação.')
      }
    } finally {
      if (mountedRef.current) {
        setIsDeletingRecording(false)
      }
    }
  }, [applyRecordingsState, onRecordingDeleted, recordingPendingDelete])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
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
  }
}
