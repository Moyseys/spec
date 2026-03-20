import { useEffect } from 'react'

export type ShortcutConfig = Record<string, (e: KeyboardEvent) => void>

export function useKeyboardShortcuts(shortcuts: ShortcutConfig) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTypingTarget =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isTypingTarget && e.key !== 'Escape' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        return
      }

      const key = buildKeyString(e)
      const handler = shortcuts[key]

      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

function buildKeyString(e: KeyboardEvent): string {
  const parts: string[] = []

  if (e.ctrlKey) parts.push('ctrl')
  if (e.metaKey) parts.push('cmd')
  if (e.shiftKey) parts.push('shift')
  if (e.altKey) parts.push('alt')

  let key = e.key.toLowerCase()
  
  if (key === 'escape') key = 'escape'
  else if (key === 'enter') key = 'enter'
  else if (key === ' ') key = 'space'
  else if (key === '/') key = '/'
  else if (key === ',') key = ','

  if (!['control', 'meta', 'shift', 'alt'].includes(key)) {
    parts.push(key)
  }

  return parts.join('+')
}

export function getShortcutDisplay(shortcut: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  return shortcut
    .split('+')
    .map(part => {
      if (part === 'cmd') return isMac ? '⌘' : 'Ctrl'
      if (part === 'ctrl') return isMac ? '⌃' : 'Ctrl'
      if (part === 'shift') return isMac ? '⇧' : 'Shift'
      if (part === 'alt') return isMac ? '⌥' : 'Alt'
      if (part === 'escape') return 'Esc'
      if (part === 'enter') return '↵'
      return part.toUpperCase()
    })
    .join(isMac ? '' : '+')
}
