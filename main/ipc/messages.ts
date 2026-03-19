import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { saveConversation, getLastConversation, clearConversations } from '../store/messages'

export function registerMessagesHandlers(): void {
  ipcMain.handle(IPC.MESSAGES_SAVE, async (_event, messages) => {
    try {
      const id = saveConversation(messages)
      return { success: true, data: id }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao salvar mensagens'
      }
    }
  })

  ipcMain.handle(IPC.MESSAGES_GET_LAST, async () => {
    try {
      const messages = getLastConversation()
      return { success: true, data: messages }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar mensagens'
      }
    }
  })

  ipcMain.handle(IPC.MESSAGES_CLEAR, async () => {
    try {
      clearConversations()
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao limpar mensagens'
      }
    }
  })
}
