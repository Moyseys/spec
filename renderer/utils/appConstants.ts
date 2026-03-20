import { FileText, MessageSquare, Mic, Settings as SettingsIcon } from 'lucide-react'
import type { SidebarItem } from '../types/app'

export const MAX_CONTEXT_MESSAGES = 20
export const RECORDINGS_SETTING_KEY = 'recordings'
export const PREFERRED_AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    shortcutKey: '1',
    description: 'Converse em tempo real com o Ghost.',
  },
  {
    id: 'recordings',
    label: 'Gravações',
    icon: Mic,
    shortcutKey: '2',
    description: 'Gerencie gravações de voz e transcrições.',
  },
  {
    id: 'summary',
    label: 'Resumo',
    icon: FileText,
    shortcutKey: '3',
    description: 'Visualize resumos e insights das conversas.',
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: SettingsIcon,
    shortcutKey: '4',
    description: 'Personalize preferências e integrações do app.',
  },
]
