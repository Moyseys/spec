import type { SidebarItem } from '../types/app'

export const getSectionShortcutHint = (shortcutKey: SidebarItem['shortcutKey']) =>
  `Cmd/Ctrl+${shortcutKey} ou Alt+${shortcutKey}`

export const formatElapsedTime = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return `${(bytes / 1024).toFixed(1)} KB`
}

export const formatRecordingDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
