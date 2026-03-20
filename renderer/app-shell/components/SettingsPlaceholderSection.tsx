import React from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Card } from '../../components/ui'

interface SettingsPlaceholderSectionProps {
  onOpenSettings: () => void
}

export const SettingsPlaceholderSection: React.FC<SettingsPlaceholderSectionProps> = ({
  onOpenSettings,
}) => (
  <div className="h-full space-y-4">
    <Card variant="default" className="bg-white/[0.02] border-white/[0.08]">
      <Card.Content className="py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">Preferências do aplicativo</h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              A seção está em evolução. Você já pode abrir o painel avançado para ajustar modelo,
              provedor de IA e dispositivo de áudio.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onOpenSettings}>
            Abrir painel atual
          </Button>
        </div>
      </Card.Content>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card variant="default" className="bg-white/[0.02] border-white/[0.08]">
        <Card.Content className="space-y-1 py-5">
          <p className="text-sm font-medium text-white">Integrações</p>
          <p className="text-sm text-zinc-400">
            Configurações de provedores, credenciais e sincronizações serão centralizadas aqui.
          </p>
        </Card.Content>
      </Card>

      <Card variant="default" className="bg-white/[0.02] border-white/[0.08]">
        <Card.Content className="space-y-1 py-5">
          <p className="text-sm font-medium text-white">Perfil de uso</p>
          <p className="text-sm text-zinc-400">
            Em breve: preferências por contexto, idioma e estilo de resposta do Ghost.
          </p>
        </Card.Content>
      </Card>
    </div>

    <Card variant="default" className="bg-white/[0.02] border-white/[0.08]">
      <Card.Content className="py-5">
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <Sparkles className="w-4 h-4 text-blue-300" />
          <span>Área preparada para evoluir sem quebrar o fluxo atual de chat.</span>
        </div>
      </Card.Content>
    </Card>
  </div>
)
