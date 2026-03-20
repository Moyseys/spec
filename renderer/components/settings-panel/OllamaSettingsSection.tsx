import React from 'react'
import { Badge, Button, Card } from '../ui'
import type { OllamaModel, OllamaStatus } from './types'

interface OllamaSettingsSectionProps {
  loadingOllama: boolean
  ollamaStatus: OllamaStatus
  ollamaModels: OllamaModel[]
  selectedModel: string
  onRefresh: () => Promise<void>
  onSelectModel: (model: string) => void
}

export const OllamaSettingsSection: React.FC<OllamaSettingsSectionProps> = ({
  loadingOllama,
  ollamaStatus,
  ollamaModels,
  selectedModel,
  onRefresh,
  onSelectModel,
}) => {
  return (
    <Card variant="default">
      <Card.Content className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-white">Modelo Ollama</label>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRefresh} loading={loadingOllama}>
              Atualizar
            </Button>
            <Badge variant={ollamaStatus.running ? 'success' : 'error'} size="sm">
              {ollamaStatus.running ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </div>

        {loadingOllama ? (
          <p className="text-sm text-ghost-text-tertiary py-2">Verificando Ollama...</p>
        ) : !ollamaStatus.running ? (
          <Card variant="solid" className="border-yellow-500/30 bg-yellow-500/10">
            <Card.Content>
              <p className="text-sm text-yellow-300 font-medium mb-2">Ollama não está rodando</p>
              <p className="text-xs text-ghost-text-secondary mb-2">
                Inicie o Ollama para usar modelos locais
              </p>
              <code className="text-xs bg-black/30 px-2 py-1 rounded text-ghost-text-tertiary">
                ollama serve
              </code>
            </Card.Content>
          </Card>
        ) : ollamaModels.length === 0 ? (
          <Card variant="solid" className="border-yellow-500/30 bg-yellow-500/10">
            <Card.Content>
              <p className="text-sm text-yellow-300 font-medium mb-2">Nenhum modelo instalado</p>
              <p className="text-xs text-ghost-text-secondary mb-2">Baixe um modelo:</p>
              <div className="space-y-1">
                <code className="text-xs bg-black/30 px-2 py-1 rounded text-ghost-text-tertiary block">
                  ollama pull phi
                </code>
                <code className="text-xs bg-black/30 px-2 py-1 rounded text-ghost-text-tertiary block">
                  ollama pull mistral
                </code>
              </div>
            </Card.Content>
          </Card>
        ) : (
          <select
            value={selectedModel}
            onChange={(event) => onSelectModel(event.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-ghost-accent-primary focus:bg-white/10 transition-all"
          >
            {ollamaModels.map((model) => (
              <option key={model.name} value={model.name} className="bg-ghost-bg-secondary">
                {model.name}
              </option>
            ))}
          </select>
        )}
      </Card.Content>
    </Card>
  )
}
