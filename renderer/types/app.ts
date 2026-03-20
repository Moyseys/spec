import type { LucideIcon } from 'lucide-react'
import type {
  ConversationMessage,
  OllamaMessage,
  RecordedAudio,
  RecordingMetadata,
  SummaryRequestPayload,
  SummaryResultPayload,
} from '@shared/ipc-channels'

export type MessageRole = ConversationMessage['role']
export type ChatRole = OllamaMessage['role']
export type AppSection = 'chat' | 'recordings' | 'summary' | 'settings'
export type RecordingStatus = 'idle' | 'recording' | 'paused'

export interface Message {
  role: MessageRole
  content: string
}

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface SidebarItem {
  id: AppSection
  label: string
  icon: LucideIcon
  shortcutKey: '1' | '2' | '3' | '4'
  description: string
}

export type { RecordedAudio, RecordingMetadata, SummaryRequestPayload, SummaryResultPayload }
