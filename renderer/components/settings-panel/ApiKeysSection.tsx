import React from 'react'
import { Badge, Button, Card, Input } from '../ui'
import type { ApiKeyValues, ApiProvider, ApiProviderFlags } from './types'

interface ApiKeysSectionProps {
  apiProviders: ApiProvider[]
  apiKeys: ApiKeyValues
  hasKeys: ApiProviderFlags
  showKeys: ApiProviderFlags
  saving: boolean
  onApiKeyChange: (provider: ApiProvider, value: string) => void
  onSaveKey: (provider: ApiProvider) => Promise<void>
}

export const ApiKeysSection: React.FC<ApiKeysSectionProps> = ({
  apiProviders,
  apiKeys,
  hasKeys,
  showKeys,
  saving,
  onApiKeyChange,
  onSaveKey,
}) => {
  return (
    <>
      {apiProviders.map((provider) => (
        <Card key={provider} variant="default">
          <Card.Content className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white">
                {provider === 'openai' ? 'OpenAI API Key' : 'Anthropic API Key'}
              </label>
              {hasKeys[provider] && (
                <Badge variant="success" size="sm">
                  Configurado
                </Badge>
              )}
            </div>
            <Input
              type={showKeys[provider] ? 'text' : 'password'}
              value={apiKeys[provider]}
              onChange={(event) => onApiKeyChange(provider, event.currentTarget.value)}
              placeholder={
                hasKeys[provider]
                  ? '••••••••••••'
                  : provider === 'openai'
                    ? 'sk-...'
                    : 'sk-ant-...'
              }
            />
            <Button
              variant="secondary"
              onClick={() => onSaveKey(provider)}
              disabled={saving || !apiKeys[provider].trim()}
              loading={saving}
              className="w-full"
            >
              {hasKeys[provider] ? 'Atualizar' : 'Salvar'}
            </Button>
          </Card.Content>
        </Card>
      ))}
    </>
  )
}
