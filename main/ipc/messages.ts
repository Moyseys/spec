import { ipcMain } from 'electron'
import type { ConversationMessage, IpcResponse } from '../../shared/ipc-channels'
import { IPC } from '../../shared/ipc-channels'
import { saveConversation, getLastConversation, clearConversations } from '../store/messages'
import {
  errorMessageFromUnknown,
  fail,
  logIpcError,
  ok,
  parseConversationMessages,
} from './utils'

export function registerMessagesHandlers(): void {
  ipcMain.handle(IPC.MESSAGES_SAVE, async (_event, payload: unknown): Promise<IpcResponse<string>> => {
    const parsedMessages = parseConversationMessages(payload)
    if (!parsedMessages.ok) {
      return fail(parsedMessages.error)
    }

    try {
      const id = saveConversation(parsedMessages.value)
      return ok(id)
    } catch (err) {
      logIpcError('messages:save', err)
      return fail(errorMessageFromUnknown(err, 'Erro ao salvar mensagens.'))
    }
  })

  ipcMain.handle(
    IPC.MESSAGES_GET_LAST,
    async (): Promise<IpcResponse<ConversationMessage[] | null>> => {
      try {
        const messages = getLastConversation()
        return ok(messages)
      } catch (err) {
        logIpcError('messages:getLast', err)
        return fail(errorMessageFromUnknown(err, 'Erro ao carregar mensagens.'))
      }
    }
  )

  ipcMain.handle(IPC.MESSAGES_CLEAR, async (): Promise<IpcResponse<void>> => {
    try {
      clearConversations()
      return ok(undefined)
    } catch (err) {
      logIpcError('messages:clear', err)
      return fail(errorMessageFromUnknown(err, 'Erro ao limpar mensagens.'))
    }
  })
}
