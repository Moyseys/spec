import React from 'react'
import { Button } from '../ui'
import type { Provider } from './types'

interface ProviderSelectionSectionProps {
  providers: Provider[]
  selectedProvider: Provider
  onSelectProvider: (provider: Provider) => void
}

export const ProviderSelectionSection: React.FC<ProviderSelectionSectionProps> = ({
  providers,
  selectedProvider,
  onSelectProvider,
}) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-ghost-text-tertiary uppercase tracking-wider">
        Provider de IA
      </label>
      <div className="grid grid-cols-3 gap-2">
        {providers.map((provider) => (
          <Button
            key={provider}
            variant={selectedProvider === provider ? 'primary' : 'secondary'}
            onClick={() => onSelectProvider(provider)}
            className="justify-center"
          >
            {provider.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  )
}
