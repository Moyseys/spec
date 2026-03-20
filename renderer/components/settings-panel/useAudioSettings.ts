import { useMemo, useState } from 'react'
import { STORE_SETTING_KEYS } from '@shared/ipc-channels'
import type {
  AudioPermissionStatus,
  AudioStatusBadge,
  StatusMessage,
} from './types'

interface UseAudioSettingsResult {
  audioDevices: MediaDeviceInfo[]
  selectedAudioDeviceId: string
  savedAudioDeviceId: string
  audioPermissionStatus: AudioPermissionStatus
  loadingAudioDevices: boolean
  requestingAudioPermission: boolean
  savingAudioDevice: boolean
  audioMessage: StatusMessage | null
  audioStatusBadge: AudioStatusBadge
  savedAudioDeviceMissing: boolean
  setSelectedAudioDeviceId: (deviceId: string) => void
  setStoredAudioDeviceId: (deviceId: string) => void
  refreshAudioDevices: (showFeedback?: boolean, preferredSelection?: string) => Promise<void>
  requestAudioPermission: () => Promise<void>
  saveAudioDevice: () => Promise<void>
}

const hasMediaDeviceSupport = (): boolean =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.enumerateDevices === 'function' &&
  typeof navigator.mediaDevices.getUserMedia === 'function'

const getDomErrorName = (error: unknown): string => {
  if (error instanceof DOMException) {
    return error.name
  }

  if (typeof error === 'object' && error !== null && 'name' in error) {
    const potentialName = (error as { name?: unknown }).name
    return typeof potentialName === 'string' ? potentialName : ''
  }

  return ''
}

export const useAudioSettings = (): UseAudioSettingsResult => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('')
  const [savedAudioDeviceId, setSavedAudioDeviceId] = useState('')
  const [audioPermissionStatus, setAudioPermissionStatus] =
    useState<AudioPermissionStatus>('unknown')
  const [loadingAudioDevices, setLoadingAudioDevices] = useState(false)
  const [requestingAudioPermission, setRequestingAudioPermission] = useState(false)
  const [savingAudioDevice, setSavingAudioDevice] = useState(false)
  const [audioMessage, setAudioMessage] = useState<StatusMessage | null>(null)

  const refreshAudioDevices = async (
    showFeedback = false,
    preferredSelection?: string
  ): Promise<void> => {
    if (!hasMediaDeviceSupport()) {
      setAudioPermissionStatus('unsupported')
      setAudioDevices([])
      setAudioMessage({
        type: 'error',
        text: 'Seu ambiente não suporta a API de áudio necessária para esta configuração.',
      })
      return
    }

    setLoadingAudioDevices(true)
    if (showFeedback) {
      setAudioMessage(null)
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const inputDevices = devices.filter((device) => device.kind === 'audioinput')
      const hasDeviceLabels = inputDevices.some((device) => device.label.trim().length > 0)

      setAudioDevices(inputDevices)
      setAudioPermissionStatus((previousStatus) => {
        if (hasDeviceLabels) return 'granted'
        if (previousStatus === 'denied') return 'denied'
        if (previousStatus === 'unsupported') return 'unsupported'
        return 'unknown'
      })

      const currentSelection = preferredSelection ?? selectedAudioDeviceId
      if (!currentSelection && inputDevices.length > 0) {
        setSelectedAudioDeviceId(inputDevices[0].deviceId)
      }

      if (showFeedback) {
        setAudioMessage({
          type: inputDevices.length > 0 ? 'success' : 'error',
          text:
            inputDevices.length > 0
              ? 'Lista de dispositivos de áudio atualizada.'
              : 'Nenhum dispositivo de entrada encontrado.',
        })
      }
    } catch (error) {
      console.error('Error listing audio devices:', error)
      const errorName = getDomErrorName(error)

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setAudioPermissionStatus('denied')
        setAudioMessage({
          type: 'error',
          text: 'Permissão de microfone negada. Libere o acesso nas configurações do sistema.',
        })
      } else {
        setAudioMessage({
          type: 'error',
          text: 'Erro ao listar dispositivos de áudio.',
        })
      }
    } finally {
      setLoadingAudioDevices(false)
    }
  }

  const requestAudioPermission = async (): Promise<void> => {
    if (!hasMediaDeviceSupport()) {
      setAudioPermissionStatus('unsupported')
      setAudioMessage({
        type: 'error',
        text: 'Seu ambiente não suporta a API de áudio necessária para esta configuração.',
      })
      return
    }

    setRequestingAudioPermission(true)
    setAudioMessage(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())

      setAudioPermissionStatus('granted')
      setAudioMessage({
        type: 'success',
        text: 'Permissão para microfone concedida.',
      })

      await refreshAudioDevices(false, selectedAudioDeviceId)
    } catch (error) {
      const errorName = getDomErrorName(error)

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setAudioPermissionStatus('denied')
        setAudioMessage({
          type: 'error',
          text: 'Permissão de microfone negada. Libere o acesso nas configurações do sistema.',
        })
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setAudioPermissionStatus('unknown')
        setAudioMessage({
          type: 'error',
          text: 'Nenhum microfone foi encontrado.',
        })
      } else {
        setAudioMessage({
          type: 'error',
          text: 'Não foi possível solicitar permissão para microfone.',
        })
      }
    } finally {
      setRequestingAudioPermission(false)
    }
  }

  const saveAudioDevice = async (): Promise<void> => {
    if (!selectedAudioDeviceId) {
      setAudioMessage({
        type: 'error',
        text: 'Selecione um dispositivo antes de salvar.',
      })
      return
    }

    setSavingAudioDevice(true)
    setAudioMessage(null)

    try {
      const result = await window.ghost.setSetting(
        STORE_SETTING_KEYS.AUDIO_DEVICE_ID,
        selectedAudioDeviceId
      )

      if (result.success) {
        setSavedAudioDeviceId(selectedAudioDeviceId)
        setAudioMessage({
          type: 'success',
          text: 'Dispositivo de áudio salvo com sucesso.',
        })
      } else {
        setAudioMessage({
          type: 'error',
          text: result.error,
        })
      }
    } catch (error) {
      console.error('Error saving audio device setting:', error)
      setAudioMessage({
        type: 'error',
        text: 'Erro ao salvar dispositivo de áudio.',
      })
    } finally {
      setSavingAudioDevice(false)
    }
  }

  const setStoredAudioDeviceId = (deviceId: string): void => {
    setSelectedAudioDeviceId(deviceId)
    setSavedAudioDeviceId(deviceId)
  }

  const audioStatusBadge: AudioStatusBadge = useMemo(() => {
    if (audioPermissionStatus === 'granted') {
      return { variant: 'success', text: 'Permissão OK' }
    }

    if (audioPermissionStatus === 'denied') {
      return { variant: 'error', text: 'Permissão negada' }
    }

    if (audioPermissionStatus === 'unsupported') {
      return { variant: 'error', text: 'Não suportado' }
    }

    return { variant: 'warning', text: 'Permissão pendente' }
  }, [audioPermissionStatus])

  const savedAudioDeviceMissing = useMemo(
    () =>
      !!savedAudioDeviceId &&
      !audioDevices.some((device) => device.deviceId === savedAudioDeviceId),
    [audioDevices, savedAudioDeviceId]
  )

  return {
    audioDevices,
    selectedAudioDeviceId,
    savedAudioDeviceId,
    audioPermissionStatus,
    loadingAudioDevices,
    requestingAudioPermission,
    savingAudioDevice,
    audioMessage,
    audioStatusBadge,
    savedAudioDeviceMissing,
    setSelectedAudioDeviceId,
    setStoredAudioDeviceId,
    refreshAudioDevices,
    requestAudioPermission,
    saveAudioDevice,
  }
}
