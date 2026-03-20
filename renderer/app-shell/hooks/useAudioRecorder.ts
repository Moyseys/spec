import { useEffect, useRef, useState } from 'react'
import { toast } from '../../components/ui'
import type { RecordingMetadata, RecordingStatus } from '../types'
import {
  createRecordingId,
  formatRecordingDateTime,
} from '../utils/formatters'
import {
  getAudioCaptureErrorMessage,
  resolveAudioMimeType,
  supportsAudioRecording,
} from '../utils/recording'

export interface RecordingCapturedPayload {
  recording: RecordingMetadata
  blob: Blob
}

interface UseAudioRecorderOptions {
  selectedAudioDeviceId: string
  isStreaming: boolean
  onRecordingCaptured: (payload: RecordingCapturedPayload) => Promise<void>
}

export const useAudioRecorder = ({
  selectedAudioDeviceId,
  isStreaming,
  onRecordingCaptured,
}: UseAudioRecorderOptions) => {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle')
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0)
  const [audioCaptureError, setAudioCaptureError] = useState<string | null>(null)
  const [isPreparingRecording, setIsPreparingRecording] = useState(false)

  const mountedRef = useRef(true)
  const onRecordingCapturedRef = useRef(onRecordingCaptured)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<BlobPart[]>([])
  const recordingMimeTypeRef = useRef('audio/webm')
  const recordingStartedAtRef = useRef<number | null>(null)
  const recordingAccumulatedMsRef = useRef(0)
  const recordingTimerRef = useRef<number | null>(null)
  const pendingFinalDurationMsRef = useRef<number | null>(null)

  useEffect(() => {
    onRecordingCapturedRef.current = onRecordingCaptured
  }, [onRecordingCaptured])

  const syncRecordingClock = () => {
    const startedAt = recordingStartedAtRef.current
    const elapsedMs =
      recordingAccumulatedMsRef.current + (startedAt ? Date.now() - startedAt : 0)

    setRecordingElapsedMs(elapsedMs)
    return elapsedMs
  }

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const startRecordingTimer = () => {
    stopRecordingTimer()
    recordingTimerRef.current = window.setInterval(() => {
      syncRecordingClock()
    }, 200)
  }

  const releaseAudioStream = () => {
    const activeStream = mediaStreamRef.current
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
  }

  const getAudioStreamForRecording = async () => {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      throw new Error('Seu ambiente não suporta captura de áudio.')
    }

    if (!selectedAudioDeviceId) {
      return {
        stream: await navigator.mediaDevices.getUserMedia({ audio: true }),
        usedFallbackDevice: false,
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedAudioDeviceId } },
      })

      return { stream, usedFallbackDevice: false }
    } catch (error) {
      const domErrorName = error instanceof DOMException ? error.name : ''
      const canFallbackToDefault =
        domErrorName === 'NotFoundError' ||
        domErrorName === 'DevicesNotFoundError' ||
        domErrorName === 'OverconstrainedError' ||
        domErrorName === 'ConstraintNotSatisfiedError'

      if (!canFallbackToDefault) {
        throw error
      }

      const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      return { stream: fallbackStream, usedFallbackDevice: true }
    }
  }

  const startRecording = async () => {
    if (recordingStatus !== 'idle' || isPreparingRecording || isStreaming) {
      return
    }

    if (!supportsAudioRecording()) {
      const unsupportedMessage = 'Seu ambiente não suporta gravação de áudio via MediaRecorder.'
      setAudioCaptureError(unsupportedMessage)
      toast.error(unsupportedMessage)
      return
    }

    setAudioCaptureError(null)
    setIsPreparingRecording(true)
    setRecordingElapsedMs(0)
    recordingChunksRef.current = []
    pendingFinalDurationMsRef.current = null
    recordingAccumulatedMsRef.current = 0
    recordingStartedAtRef.current = null

    let temporaryStream: MediaStream | null = null

    try {
      const { stream, usedFallbackDevice } = await getAudioStreamForRecording()
      temporaryStream = stream

      if (stream.getAudioTracks().length === 0) {
        throw new DOMException('Nenhum dispositivo de áudio encontrado.', 'NotFoundError')
      }

      const preferredMimeType = resolveAudioMimeType()
      let recorder: MediaRecorder

      try {
        recorder = preferredMimeType
          ? new MediaRecorder(stream, { mimeType: preferredMimeType })
          : new MediaRecorder(stream)
      } catch (error) {
        if (preferredMimeType) {
          recorder = new MediaRecorder(stream)
        } else {
          throw error
        }
      }

      recordingMimeTypeRef.current = recorder.mimeType || preferredMimeType || 'audio/webm'
      mediaRecorderRef.current = recorder
      mediaStreamRef.current = stream
      temporaryStream = null

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onerror = (event: Event) => {
        const recorderError = (event as Event & { error?: DOMException }).error
        const message = recorderError
          ? getAudioCaptureErrorMessage(recorderError)
          : 'Erro durante a gravação de áudio.'

        console.error('Recording error:', recorderError || event)
        setAudioCaptureError(message)
        toast.error(message)
      }

      recorder.onstop = () => {
        stopRecordingTimer()

        const finalDurationMs = Math.max(
          0,
          pendingFinalDurationMsRef.current !== null
            ? pendingFinalDurationMsRef.current
            : syncRecordingClock()
        )
        const finalMimeType = recordingMimeTypeRef.current || 'audio/webm'
        const finalBlob = new Blob(recordingChunksRef.current, { type: finalMimeType })
        const createdAt = Date.now()
        const recordingId = createRecordingId()
        const nextRecording: RecordingMetadata = {
          id: recordingId,
          createdAt,
          durationMs: finalDurationMs,
          size: finalBlob.size,
          mimeType: finalBlob.type || finalMimeType,
          deviceId: selectedAudioDeviceId || undefined,
          title: `Gravação ${formatRecordingDateTime(createdAt)}`,
        }

        const finalizeCleanup = () => {
          releaseAudioStream()
          mediaRecorderRef.current = null
          recordingChunksRef.current = []
          recordingStartedAtRef.current = null
          recordingAccumulatedMsRef.current = 0
          pendingFinalDurationMsRef.current = null
          setRecordingElapsedMs(finalDurationMs)
          setRecordingStatus('idle')
          setIsPreparingRecording(false)
          setAudioCaptureError(null)
        }

        if (finalBlob.size <= 0) {
          finalizeCleanup()
          toast.warning('Gravação concluída, mas nenhum áudio foi capturado.')
          return
        }

        void (async () => {
          try {
            await onRecordingCapturedRef.current({ recording: nextRecording, blob: finalBlob })
          } catch (err) {
            console.error('Error handling captured recording:', err)
          } finally {
            if (mountedRef.current) {
              finalizeCleanup()
            }
          }
        })()
      }

      recordingAccumulatedMsRef.current = 0
      recordingStartedAtRef.current = Date.now()
      setRecordingStatus('recording')
      startRecordingTimer()
      recorder.start(250)

      if (usedFallbackDevice && selectedAudioDeviceId) {
        toast.info('Microfone salvo indisponível. Usando o dispositivo padrão.')
      }
      toast.success('Gravação iniciada.')
    } catch (error) {
      console.error('Start recording error:', error)
      stopRecordingTimer()
      if (temporaryStream) {
        temporaryStream.getTracks().forEach((track) => track.stop())
      }
      releaseAudioStream()
      mediaRecorderRef.current = null
      recordingChunksRef.current = []
      recordingStartedAtRef.current = null
      recordingAccumulatedMsRef.current = 0
      pendingFinalDurationMsRef.current = null
      setRecordingStatus('idle')
      setIsPreparingRecording(false)
      setRecordingElapsedMs(0)

      const message =
        error instanceof DOMException
          ? getAudioCaptureErrorMessage(error)
          : 'Não foi possível iniciar a gravação de áudio.'

      setAudioCaptureError(message)
      toast.error(message)
    }
  }

  const pauseRecording = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recordingStatus !== 'recording' || isPreparingRecording) {
      return
    }

    try {
      recorder.pause()

      if (recordingStartedAtRef.current) {
        recordingAccumulatedMsRef.current += Date.now() - recordingStartedAtRef.current
      }

      stopRecordingTimer()
      recordingStartedAtRef.current = null
      setRecordingElapsedMs(recordingAccumulatedMsRef.current)
      setRecordingStatus('paused')
      toast.info('Gravação pausada.')
    } catch (error) {
      console.error('Pause recording error:', error)
      const message = 'Não foi possível pausar a gravação.'
      setAudioCaptureError(message)
      toast.error(message)
    }
  }

  const resumeRecording = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recordingStatus !== 'paused' || isPreparingRecording) {
      return
    }

    try {
      recorder.resume()
      recordingStartedAtRef.current = Date.now()
      setRecordingStatus('recording')
      startRecordingTimer()
      toast.info('Gravação retomada.')
    } catch (error) {
      console.error('Resume recording error:', error)
      const message = 'Não foi possível retomar a gravação.'
      setAudioCaptureError(message)
      toast.error(message)
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || isPreparingRecording || recordingStatus === 'idle') {
      return
    }

    try {
      pendingFinalDurationMsRef.current = syncRecordingClock()
      recordingStartedAtRef.current = null
      stopRecordingTimer()
      setIsPreparingRecording(true)
      recorder.stop()
    } catch (error) {
      console.error('Stop recording error:', error)
      setIsPreparingRecording(false)
      const message = 'Não foi possível finalizar a gravação.'
      setAudioCaptureError(message)
      toast.error(message)
    }
  }

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      stopRecordingTimer()

      const recorder = mediaRecorderRef.current
      if (recorder) {
        recorder.ondataavailable = null
        recorder.onerror = null
        recorder.onstop = null

        if (recorder.state !== 'inactive') {
          try {
            recorder.stop()
          } catch (err) {
            console.error('Error stopping recorder on cleanup:', err)
          }
        }
      }

      mediaRecorderRef.current = null
      recordingChunksRef.current = []
      recordingStartedAtRef.current = null
      recordingAccumulatedMsRef.current = 0
      pendingFinalDurationMsRef.current = null
      releaseAudioStream()
    }
  }, [])

  return {
    recordingStatus,
    recordingElapsedMs,
    audioCaptureError,
    isPreparingRecording,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  }
}
