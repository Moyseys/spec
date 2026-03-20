import React, { useEffect, useState } from 'react'
import {
  STORE_SETTING_KEYS,
  type DefaultAIProvider,
  type OllamaModel,
  type OllamaStatus,
} from '@shared/ipc-channels'
import { Modal, Button, Badge } from './ui'
import {
  API_PROVIDERS,
  EMPTY_API_FLAGS,
  EMPTY_API_KEYS,
  PROVIDERS,
  ApiKeysSection,
  AudioSettingsSection,
  OllamaSettingsSection,
  ProviderSelectionSection,
  useAudioSettings,
  type ApiKeyValues,
  type ApiProvider,
  type ApiProviderFlags,
  type Provider,
  type StatusMessage,
} from './settings-panel'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

const isProvider = (value: DefaultAIProvider | undefined): value is Provider =>
  value === 'ollama' || value === 'openai' || value === 'anthropic'

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState<Provider>('ollama')
  const [apiKeys, setApiKeys] = useState<ApiKeyValues>({ ...EMPTY_API_KEYS })
  const [hasKeys, setHasKeys] = useState<ApiProviderFlags>({ ...EMPTY_API_FLAGS })
  const [showKeys, setShowKeys] = useState<ApiProviderFlags>({ ...EMPTY_API_FLAGS })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<StatusMessage | null>(null)

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({ running: false })
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [loadingOllama, setLoadingOllama] = useState(false)

  const {
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
  } = useAudioSettings()

  useEffect(() => {
    void loadSettings()
    void checkOllama()
  }, [])

  const loadSettings = async () => {
    try {
      let storedAudioDeviceId = ''

      const providerResult = await window.ghost.getSetting(STORE_SETTING_KEYS.DEFAULT_AI_PROVIDER)
      if (providerResult.success && isProvider(providerResult.data)) {
        setSelectedProvider(providerResult.data)
      }

      const modelResult = await window.ghost.getSetting(STORE_SETTING_KEYS.OLLAMA_MODEL)
      if (
        modelResult.success &&
        typeof modelResult.data === 'string' &&
        modelResult.data.length > 0
      ) {
        setSelectedModel(modelResult.data)
      }

      const audioDeviceResult = await window.ghost.getSetting(STORE_SETTING_KEYS.AUDIO_DEVICE_ID)
      if (
        audioDeviceResult.success &&
        typeof audioDeviceResult.data === 'string' &&
        audioDeviceResult.data.length > 0
      ) {
        storedAudioDeviceId = audioDeviceResult.data
        setStoredAudioDeviceId(audioDeviceResult.data)
      }

      const openaiHas = await window.ghost.hasAPIKey('openai')
      const anthropicHas = await window.ghost.hasAPIKey('anthropic')

      setHasKeys({
        openai: openaiHas.success ? (openaiHas.data ?? false) : false,
        anthropic: anthropicHas.success ? (anthropicHas.data ?? false) : false,
      })

      await refreshAudioDevices(false, storedAudioDeviceId)
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({
        type: 'error',
        text: 'Não foi possível carregar as configurações.',
      })
    }
  }

  const checkOllama = async () => {
    setLoadingOllama(true)
    try {
      const statusResult = await window.ghost.ollama.checkStatus()
      if (statusResult.success) {
        setOllamaStatus(statusResult.data)

        if (statusResult.data.running && statusResult.data.models) {
          setOllamaModels(statusResult.data.models)

          if (!selectedModel && statusResult.data.models.length > 0) {
            setSelectedModel(statusResult.data.models[0].name)
          }
        }
      } else {
        setOllamaStatus({ running: false, error: statusResult.error })
      }
    } catch (error) {
      console.error('Error checking Ollama:', error)
      setOllamaStatus({ running: false, error: 'Não foi possível verificar o status do Ollama.' })
    } finally {
      setLoadingOllama(false)
    }
  }

  const handleSaveKey = async (provider: ApiProvider) => {
    const key = apiKeys[provider].trim()
    if (!key) {
      setMessage({ type: 'error', text: 'Informe uma API key válida.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const result = await window.ghost.setAPIKey(provider, key)

      if (result.success) {
        setMessage({ type: 'success', text: 'API key salva com sucesso.' })
        setHasKeys((previous) => ({ ...previous, [provider]: true }))
        setApiKeys((previous) => ({ ...previous, [provider]: '' }))
        setShowKeys((previous) => ({ ...previous, [provider]: false }))

        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Não foi possível salvar a API key.' })
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      setMessage({ type: 'error', text: 'Não foi possível salvar a API key.' })
    } finally {
      setSaving(false)
    }
  }

  const handleApiKeyChange = (provider: ApiProvider, value: string) => {
    setApiKeys((previous) => ({ ...previous, [provider]: value }))
  }

  const handleSaveProvider = async () => {
    setSaving(true)
    try {
      const result = await window.ghost.setSetting(
        STORE_SETTING_KEYS.DEFAULT_AI_PROVIDER,
        selectedProvider
      )
      if (result.success) {
        if (selectedProvider === 'ollama' && selectedModel) {
          const modelResult = await window.ghost.setSetting(STORE_SETTING_KEYS.OLLAMA_MODEL, selectedModel)
          if (!modelResult.success) {
            setMessage({
              type: 'error',
              text: modelResult.error || 'Não foi possível salvar o modelo do Ollama.',
            })
            return
          }
        }
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso.' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Não foi possível salvar as configurações.',
        })
      }
    } catch (error) {
      console.error('Error saving provider settings:', error)
      setMessage({ type: 'error', text: 'Não foi possível salvar as configurações.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações"
      description="Gerencie seus providers de IA e configurações"
      size="lg"
    >
      <div className="space-y-6 max-h-[60vh] overflow-y-auto">
        <ProviderSelectionSection
          providers={PROVIDERS}
          selectedProvider={selectedProvider}
          onSelectProvider={setSelectedProvider}
        />

        <AudioSettingsSection
          audioPermissionStatus={audioPermissionStatus}
          audioStatusBadge={audioStatusBadge}
          audioDevices={audioDevices}
          selectedAudioDeviceId={selectedAudioDeviceId}
          savedAudioDeviceId={savedAudioDeviceId}
          savedAudioDeviceMissing={savedAudioDeviceMissing}
          loadingAudioDevices={loadingAudioDevices}
          requestingAudioPermission={requestingAudioPermission}
          savingAudioDevice={savingAudioDevice}
          audioMessage={audioMessage}
          onRefreshDevices={() => refreshAudioDevices(true)}
          onRequestAudioPermission={requestAudioPermission}
          onSaveAudioDevice={saveAudioDevice}
          onSelectedAudioDeviceIdChange={setSelectedAudioDeviceId}
        />

        {selectedProvider === 'ollama' && (
          <OllamaSettingsSection
            loadingOllama={loadingOllama}
            ollamaStatus={ollamaStatus}
            ollamaModels={ollamaModels}
            selectedModel={selectedModel}
            onRefresh={checkOllama}
            onSelectModel={setSelectedModel}
          />
        )}

        <ApiKeysSection
          apiProviders={API_PROVIDERS}
          apiKeys={apiKeys}
          hasKeys={hasKeys}
          showKeys={showKeys}
          saving={saving}
          onApiKeyChange={handleApiKeyChange}
          onSaveKey={handleSaveKey}
        />

        {message && (
          <Badge
            variant={message.type === 'success' ? 'success' : 'error'}
            className="w-full justify-center py-3"
          >
            {message.text}
          </Badge>
        )}
      </div>

      <div className="flex gap-3 pt-4 mt-6 border-t border-white/10">
        <Button
          variant="primary"
          onClick={handleSaveProvider}
          disabled={saving}
          loading={saving}
          className="flex-1"
        >
          Salvar Configurações
        </Button>
      </div>
    </Modal>
  )
}

export default Settings
