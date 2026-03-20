import { useEffect, useState } from 'react'
import { toast } from '../../components/ui'
import { getRecordingBlob } from '../../utils/audioStorage'
import type { RecordingMetadata } from '../types'

export const useRecordingPlayback = (recordings: RecordingMetadata[]) => {
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null)
  const [activePlaybackId, setActivePlaybackId] = useState<string | null>(null)

  const stopActivePlayback = () => {
    setActivePlaybackId(null)

    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl)
      setActiveAudioUrl(null)
    }
  }

  const playRecording = async (recording: RecordingMetadata) => {
    try {
      const blob = await getRecordingBlob(recording.id)

      if (!blob) {
        toast.error('Áudio não encontrado no armazenamento local.')
        return
      }

      if (activeAudioUrl) {
        URL.revokeObjectURL(activeAudioUrl)
      }

      const nextObjectUrl = URL.createObjectURL(blob)
      setActiveAudioUrl(nextObjectUrl)
      setActivePlaybackId(recording.id)
    } catch (err) {
      console.error('Error loading recording blob:', err)
      if (err instanceof Error && err.message.includes('IndexedDB')) {
        toast.error('O armazenamento local de áudio não está disponível neste ambiente.')
      } else {
        toast.error('Não foi possível carregar o áudio gravado.')
      }
    }
  }

  useEffect(() => {
    return () => {
      if (activeAudioUrl) {
        URL.revokeObjectURL(activeAudioUrl)
      }
    }
  }, [activeAudioUrl])

  useEffect(() => {
    if (!activePlaybackId) {
      return
    }

    if (recordings.some((recording) => recording.id === activePlaybackId)) {
      return
    }

    setActivePlaybackId(null)
    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl)
      setActiveAudioUrl(null)
    }
  }, [activeAudioUrl, activePlaybackId, recordings])

  return {
    activeAudioUrl,
    activePlaybackId,
    playRecording,
    stopActivePlayback,
  }
}
