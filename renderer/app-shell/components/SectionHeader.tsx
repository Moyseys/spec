import React from 'react'
import { Badge, Card } from '../../components/ui'
import { getSectionShortcutHint } from '../constants'
import type { SidebarItem } from '../types'

interface SectionHeaderProps {
  item: SidebarItem
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ item }) => {
  const Icon = item.icon

  return (
    <Card.Header className="border-b border-white/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{item.label}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
          </div>
        </div>
        <Badge variant="default" size="sm">
          {getSectionShortcutHint(item.shortcutKey)}
        </Badge>
      </div>
    </Card.Header>
  )
}
