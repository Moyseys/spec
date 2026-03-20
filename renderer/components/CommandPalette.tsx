import React, { useState, useEffect, useMemo } from 'react'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Settings,
  Trash2,
  X,
  Download,
  Copy,
  Minimize2,
  Power,
  Keyboard,
} from 'lucide-react'
import { getShortcutDisplay } from '../hooks/useKeyboardShortcuts'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommand: (command: string) => void
}

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string
  onSelect: () => void
  category: 'chat' | 'navigation' | 'system'
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onCommand,
}) => {
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  const commands: CommandItem[] = useMemo(
    () => [
      // Chat
      {
        id: 'new-conversation',
        label: 'Nova conversa',
        icon: <MessageSquare className="w-4 h-4" />,
        shortcut: 'cmd+n',
        onSelect: () => onCommand('new-conversation'),
        category: 'chat',
      },
      {
        id: 'clear-history',
        label: 'Limpar histórico',
        icon: <Trash2 className="w-4 h-4" />,
        onSelect: () => onCommand('clear-history'),
        category: 'chat',
      },
      {
        id: 'copy-last',
        label: 'Copiar última resposta',
        icon: <Copy className="w-4 h-4" />,
        onSelect: () => onCommand('copy-last'),
        category: 'chat',
      },
      {
        id: 'export-chat',
        label: 'Exportar conversa',
        icon: <Download className="w-4 h-4" />,
        onSelect: () => onCommand('export-chat'),
        category: 'chat',
      },

      // Navigation
      {
        id: 'settings',
        label: 'Configurações',
        icon: <Settings className="w-4 h-4" />,
        shortcut: 'cmd+,',
        onSelect: () => onCommand('settings'),
        category: 'navigation',
      },
      {
        id: 'shortcuts',
        label: 'Ver atalhos',
        icon: <Keyboard className="w-4 h-4" />,
        shortcut: 'cmd+/',
        onSelect: () => onCommand('shortcuts'),
        category: 'navigation',
      },

      // System
      {
        id: 'hide-window',
        label: 'Esconder janela',
        icon: <X className="w-4 h-4" />,
        shortcut: 'escape',
        onSelect: () => onCommand('hide-window'),
        category: 'system',
      },
      {
        id: 'minimize',
        label: 'Minimizar',
        icon: <Minimize2 className="w-4 h-4" />,
        onSelect: () => onCommand('minimize'),
        category: 'system',
      },
      {
        id: 'quit',
        label: 'Sair',
        icon: <Power className="w-4 h-4" />,
        shortcut: 'cmd+q',
        onSelect: () => onCommand('quit'),
        category: 'system',
      },
    ],
    [onCommand]
  )

  const categories = {
    chat: 'Chat',
    navigation: 'Navegação',
    system: 'Sistema',
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Command Dialog */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full max-w-xl"
            >
              <Command className="glass-strong rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="flex items-center border-b border-white/[0.06] px-4">
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Buscar comando..."
                    className="w-full bg-transparent border-none outline-none py-4 text-white placeholder-zinc-500 text-sm"
                  />
                  <kbd className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded">
                    ESC
                  </kbd>
                </div>

                <Command.List className="max-h-[400px] overflow-y-auto py-2">
                  <Command.Empty className="py-8 text-center text-sm text-zinc-500">
                    Nenhum comando encontrado
                  </Command.Empty>

                  {(Object.keys(categories) as Array<keyof typeof categories>).map((category) => {
                    const categoryCommands = commands.filter(
                      (cmd) => cmd.category === category
                    )
                    if (categoryCommands.length === 0) return null

                    return (
                      <Command.Group
                        key={category}
                        heading={categories[category]}
                        className="px-2"
                      >
                        <div className="text-xs font-medium text-zinc-500 px-3 py-2">
                          {categories[category]}
                        </div>
                        {categoryCommands.map((command) => (
                          <Command.Item
                            key={command.id}
                            value={command.label}
                            onSelect={() => {
                              command.onSelect()
                              onOpenChange(false)
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-white/5 text-zinc-300 data-[selected=true]:text-white transition-colors mb-1"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-zinc-500">{command.icon}</div>
                              <span className="text-sm">{command.label}</span>
                            </div>
                            {command.shortcut && (
                              <kbd className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded">
                                {getShortcutDisplay(command.shortcut)}
                              </kbd>
                            )}
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )
                  })}
                </Command.List>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
