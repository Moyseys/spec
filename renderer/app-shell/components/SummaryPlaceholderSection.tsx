import React from 'react'
import { FileText } from 'lucide-react'
import { Card, EmptyState } from '../../components/ui'

export const SummaryPlaceholderSection: React.FC = () => (
  <div className="h-full space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card variant="default" className="bg-white/[0.02] border-white/[0.08]">
        <Card.Content className="space-y-1 py-5">
          <p className="text-sm font-medium text-white">Resumo diário</p>
          <p className="text-sm text-zinc-400">
            Consolidará os principais tópicos, decisões e próximos passos.
          </p>
        </Card.Content>
      </Card>

      <Card variant="default" className="bg-white/[0.02] border-white/[0.08]">
        <Card.Content className="space-y-1 py-5">
          <p className="text-sm font-medium text-white">Insights automáticos</p>
          <p className="text-sm text-zinc-400">
            Destacará padrões, temas frequentes e oportunidades de ação.
          </p>
        </Card.Content>
      </Card>
    </div>

    <Card variant="default" className="bg-white/[0.02] border-white/[0.08] min-h-[320px]">
      <Card.Content className="h-full">
        <EmptyState
          title="Resumo ainda não gerado"
          description="Depois de algumas interações e gravações, esta área exibirá um panorama consolidado em português claro e objetivo."
          icon={<FileText className="w-10 h-10 text-white" />}
        />
      </Card.Content>
    </Card>
  </div>
)
