import React, { useState, useEffect } from 'react'

interface SettingsProps {
  onClose: () => void
}

type Provider = 'openai' | 'anthropic' | 'ollama'

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState<Provider>('ollama')
  const [apiKeys, setApiKeys] = useState({ openai: '', anthropic: '' })
  const [hasKeys, setHasKeys] = useState({ openai: false, anthropic: false })
  const [showKeys, setShowKeys] = useState({ openai: false, anthropic: false })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const providerResult = await window.ghost.getSetting('defaultAIProvider')
      if (providerResult.success && providerResult.data) {
        setSelectedProvider(providerResult.data as Provider)
      }

      const openaiHas = await window.ghost.hasAPIKey('openai')
      const anthropicHas = await window.ghost.hasAPIKey('anthropic')
      
      setHasKeys({
        openai: openaiHas.data || false,
        anthropic: anthropicHas.data || false,
      })
    } catch (err) {
      console.error('Error loading settings:', err)
    }
  }

  const handleSaveKey = async (provider: 'openai' | 'anthropic') => {
    const key = apiKeys[provider].trim()
    if (!key) {
      setMessage({ type: 'error', text: 'API key vazia' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const result = await window.ghost.setAPIKey(provider, key)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'API key salva com sucesso' })
        setHasKeys(prev => ({ ...prev, [provider]: true }))
        setApiKeys(prev => ({ ...prev, [provider]: '' }))
        setShowKeys(prev => ({ ...prev, [provider]: false }))
        
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao salvar' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar API key' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProvider = async () => {
    setSaving(true)
    try {
      const result = await window.ghost.setSetting('defaultAIProvider', selectedProvider)
      if (result.success) {
        setMessage({ type: 'success', text: 'Provider salvo' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar' })
    } finally {
      setSaving(false)
    }
  }

  const providers: Provider[] = ['ollama', 'openai', 'anthropic']
  const apiProviders: Array<'openai' | 'anthropic'> = ['openai', 'anthropic']

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black/50 backdrop-blur-sm absolute inset-0 z-50">
      <div className="w-full max-w-2xl max-h-[85vh] bg-black/80 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Configurações</h2>
            <button 
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          
          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Provider de AI</label>
            <div className="grid grid-cols-3 gap-2">
              {providers.map((provider) => (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  className={'py-3 px-4 rounded-lg border transition-all text-sm font-medium ' + (
                    selectedProvider === provider
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20 hover:bg-white/10'
                  )}
                >
                  {provider === 'ollama' && 'Ollama'}
                  {provider === 'openai' && 'OpenAI'}
                  {provider === 'anthropic' && 'Claude'}
                </button>
              ))}
            </div>
          </div>

          {apiProviders.map((provider) => (
            <div key={provider} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {provider === 'openai' ? 'OpenAI API Key' : 'Anthropic API Key'}
                </label>
                {hasKeys[provider] && <span className="text-xs text-emerald-400">OK</span>}
              </div>
              <div className="space-y-2">
                <input
                  type={showKeys[provider] ? 'text' : 'password'}
                  value={apiKeys[provider]}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                  placeholder={hasKeys[provider] ? '••••••••••••' : (provider === 'openai' ? 'sk-...' : 'sk-ant-...')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                />
                <button
                  onClick={() => handleSaveKey(provider)}
                  disabled={saving || !apiKeys[provider].trim()}
                  className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:cursor-not-allowed text-white disabled:text-zinc-600 text-sm font-medium transition-all"
                >
                  {saving ? 'Salvando...' : (hasKeys[provider] ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </div>
          ))}

          {message && (
            <div className={'px-4 py-3 rounded-lg text-sm ' + (message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30')}>
              {message.text}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/5">
          <button
            onClick={handleSaveProvider}
            disabled={saving}
            className="w-full py-3 rounded-lg bg-white hover:bg-white/90 disabled:bg-white/50 text-black font-medium transition-all"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
