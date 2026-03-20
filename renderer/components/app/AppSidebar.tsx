import type React from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Tooltip } from '../ui'
import { cn } from '../../utils/cn'
import { SIDEBAR_ITEMS } from '../../utils/appConstants'
import { getSectionShortcutHint } from '../../utils/formatters'
import type { AppSection } from '../../types/app'

interface AppSidebarProps {
  activeSection: AppSection
  isSidebarCollapsed: boolean
  onToggleCollapse: () => void
  onGoToSection: (section: AppSection) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeSection,
  isSidebarCollapsed,
  onToggleCollapse,
  onGoToSection,
  onKeyDown,
}) => {
  return (
    <aside
      className={cn(
        'h-full border-r border-white/[0.06] bg-white/[0.02] p-3 flex flex-col transition-all duration-200',
        isSidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        {!isSidebarCollapsed && (
          <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Navegação</span>
        )}
        <Tooltip
          content={
            isSidebarCollapsed
              ? 'Expandir barra lateral'
              : 'Recolher barra lateral'
          }
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-md border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            aria-label={
              isSidebarCollapsed
                ? 'Expandir barra lateral'
                : 'Recolher barra lateral'
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 mx-auto" />
            ) : (
              <PanelLeftClose className="w-4 h-4 mx-auto" />
            )}
          </button>
        </Tooltip>
      </div>

      <nav
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex-1 space-y-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:ring-offset-1 focus:ring-offset-black"
        aria-label="Navegação principal"
      >
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeSection

          const itemButton = (
            <button
              key={item.id}
              type="button"
              onClick={() => onGoToSection(item.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all',
                'focus:outline-none focus:ring-1 focus:ring-blue-500/40',
                isActive
                  ? 'border-blue-400/30 bg-blue-500/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.label}. ${getSectionShortcutHint(item.shortcutKey)}`}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-blue-300' : 'text-zinc-500'
                )}
              />
              {!isSidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {item.shortcutKey}
                  </span>
                </>
              )}
            </button>
          )

          if (isSidebarCollapsed) {
            return (
              <Tooltip
                key={item.id}
                content={`${item.label} (${getSectionShortcutHint(item.shortcutKey)})`}
              >
                {itemButton}
              </Tooltip>
            )
          }

          return <div key={item.id}>{itemButton}</div>
        })}
      </nav>

      {!isSidebarCollapsed && (
        <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
          <p className="text-xs font-medium text-zinc-300">Atalhos de seção</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">Cmd/Ctrl+1..4 ou Alt+1..4</p>
        </div>
      )}
    </aside>
  )
}
