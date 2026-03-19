import Store from 'electron-store'

interface Message {
  role: 'user' | 'assistant'
  content: string
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

export function saveConversation(messages: Message[]): string {
  const conversations = messagesStore.get('conversations', [])
  const id = Date.now().toString()
  
  const conversation: Conversation = {
    id,
    messages,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  conversations.unshift(conversation)
  
  const maxConversations = 50
  if (conversations.length > maxConversations) {
    conversations.splice(maxConversations)
  }

  messagesStore.set('conversations', conversations)
  return id
}

export function getLastConversation(): Message[] | null {
  const conversations = messagesStore.get('conversations', [])
  if (conversations.length === 0) return null
  return conversations[0].messages
}

export function clearConversations(): void {
  messagesStore.set('conversations', [])
}

export function getAllConversations(): Conversation[] {
  return messagesStore.get('conversations', [])
}
