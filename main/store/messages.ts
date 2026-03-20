import Store from 'electron-store'
import type { ConversationMessage } from '../../shared/ipc-channels'

interface Message extends ConversationMessage {
  timestamp: number
}

interface Conversation {
  id: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

const messagesStore = new Store<{ conversations: Conversation[] }>({
  name: 'messages',
  defaults: {
    conversations: []
  }
})

export function saveConversation(messages: ConversationMessage[]): string {
  const conversations = messagesStore.get('conversations', [])
  const id = Date.now().toString()
  const now = Date.now()
  const normalizedMessages: Message[] = messages.map((message) => ({
    role: message.role,
    content: message.content,
    timestamp:
      typeof message.timestamp === 'number' && Number.isFinite(message.timestamp)
        ? message.timestamp
        : now,
  }))
  
  const conversation: Conversation = {
    id,
    messages: normalizedMessages,
    createdAt: now,
    updatedAt: now
  }

  conversations.unshift(conversation)
  
  const maxConversations = 50
  if (conversations.length > maxConversations) {
    conversations.splice(maxConversations)
  }

  messagesStore.set('conversations', conversations)
  return id
}

export function getLastConversation(): ConversationMessage[] | null {
  const conversations = messagesStore.get('conversations', [])
  if (conversations.length === 0) return null
  return conversations[0].messages.map((message) => ({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
  }))
}

export function clearConversations(): void {
  messagesStore.set('conversations', [])
}

export function getAllConversations(): Conversation[] {
  return messagesStore.get('conversations', [])
}
