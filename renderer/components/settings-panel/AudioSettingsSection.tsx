import React from 'react'
import { Badge, Button, Card } from '../ui'
import type {
  AudioPermissionStatus,
  AudioStatusBadge,
  StatusMessage,
} from './types'

interface AudioSettingsSectionProps {
  audioPermissionStatus: AudioPermissionStatus
  audioStatusBadge: AudioStatusBadge
  audioDevices: MediaDeviceInfo[]
  selectedAudioDeviceId: string
  savedAudioDeviceId: string
  savedAudioDeviceMissing: boolean
  loadingAudioDevices: boolean
  requestingAudioPermission: boolean
  savingAudioDevice: boolean
  audioMessage: StatusMessage | null
  onRefreshDevices: () => Promise<void>
  onRequestAudioPermission: () => Promise<void>
  onSaveAudioDevice: () => Promise<void>
  onSelectedAudioDeviceIdChange: (deviceId: string) => void
}

export const AudioSettingsSection: React.FC<AudioSettingsSectionProps> = ({
  audioPermissionStatus,
  audioStatusBadge,
  audioDevices,
  selectedAudioDeviceId,
  savedAudioDeviceId,
  savedAudioDeviceMissing,
  loadingAudioDevices,
  requestingAudioPermission,
  savingAudioDevice,
  audioMessage,
  onRefreshDevices,
  onRequestAudioPermission,
  onSaveAudioDevice,
  onSelectedAudioDeviceIdChange,
}) => {
  return (
    <Card variant="default">
      <Card.Content className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <label className="text-sm font-semibold text-white">Áudio</label>
            <p className="text-xs text-ghost-text-secondary mt-1">
              Selecione o microfone padrão para captura.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshDevices}
              loading={loadingAudioDevices}
              disabled={audioPermissionStatus === 'unsupported'}
            >
              Atualizar
            </Button>
            <Badge variant={audioStatusBadge.variant} size="sm">
              {audioStatusBadge.text}
            </Badge>
          </div>
        </div>

        {audioPermissionStatus === 'unsupported' ? (
          <Card variant="solid" className="border-red-500/30 bg-red-500/10">
            <Card.Content>
              <p className="text-sm text-red-300 font-medium mb-1">API de áudio indisponível</p>
              <p className="text-xs text-ghost-text-secondary">
                Este ambiente não suporta a API MediaDevices necessária para selecionar microfones.
              </p>
            </Card.Content>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onRequestAudioPermission}
                loading={requestingAudioPermission}
              >
                {audioPermissionStatus === 'granted' ? 'Permissão concedida' : 'Permitir microfone'}
              </Button>

              {selectedAudioDeviceId && savedAudioDeviceId === selectedAudioDeviceId && (
                <Badge variant="success" size="sm">
                  Dispositivo salvo
                </Badge>
              )}

              {selectedAudioDeviceId && savedAudioDeviceId !== selectedAudioDeviceId && (
                <Badge variant="warning" size="sm">
                  Alteração não salva
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-ghost-text-tertiary uppercase tracking-wider">
                Dispositivo de entrada
              </label>
              <select
                value={selectedAudioDeviceId}
                onChange={(event) => onSelectedAudioDeviceIdChange(event.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-ghost-accent-primary focus:bg-white/10 transition-all"
                disabled={loadingAudioDevices}
              >
                <option value="" className="bg-ghost-bg-secondary">
                  Selecione um microfone
                </option>
                {savedAudioDeviceMissing && (
                  <option value={savedAudioDeviceId} className="bg-ghost-bg-secondary">
                    Dispositivo salvo (não encontrado)
                  </option>
                )}
                {audioDevices.map((device, index) => (
                  <option
                    key={`${device.deviceId || 'audio-input'}-${index}`}
                    value={device.deviceId}
                    className="bg-ghost-bg-secondary"
                  >
                    {device.label.trim().length > 0 ? device.label : `Microfone ${index + 1}`}
                  </option>
                ))}
              </select>

              {audioPermissionStatus !== 'granted' && (
                <p className="text-xs text-ghost-text-secondary">
                  Conceda permissão para visualizar os nomes completos dos dispositivos.
                </p>
              )}

              {!loadingAudioDevices && audioDevices.length === 0 && (
                <p className="text-xs text-ghost-text-secondary">
                  Nenhum dispositivo de entrada detectado.
                </p>
              )}
            </div>

            <Button
              variant="secondary"
              onClick={onSaveAudioDevice}
              loading={savingAudioDevice}
              disabled={savingAudioDevice || !selectedAudioDeviceId}
              className="w-full"
            >
              Salvar dispositivo de áudio
            </Button>

            {audioMessage && (
              <Badge
                variant={audioMessage.type === 'success' ? 'success' : 'error'}
                className="w-full justify-center py-3"
              >
                {audioMessage.text}
              </Badge>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  )
}
