import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { 
  getConfig, 
  setConfig, 
  setAPIKey, 
  getAPIKey, 
  hasAPIKey, 
  clearAPIKeys,
  validateAPIKeyFormat 
} from '../store';
import type { AppConfig } from '../store';

export function registerStoreHandlers(): void {
  // Generic store get/set
  ipcMain.handle(IPC.STORE_GET, (_event, key: keyof AppConfig) => {
    try {
      return { success: true, data: getConfig(key) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(IPC.STORE_SET, (_event, key: keyof AppConfig, value: any) => {
    try {
      setConfig(key, value);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // API Key management
  ipcMain.handle(
    IPC.STORE_SET_API_KEY,
    (_event, provider: 'openai' | 'anthropic' | 'whisper', key: string) => {
      // Validar formato antes de salvar
      const validation = validateAPIKeyFormat(provider, key);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      return setAPIKey(provider, key);
    }
  );

  ipcMain.handle(
    IPC.STORE_GET_API_KEY,
    (_event, provider: 'openai' | 'anthropic' | 'whisper') => {
      try {
        const key = getAPIKey(provider);
        return { success: true, data: key };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC.STORE_HAS_API_KEY,
    (_event, provider: 'openai' | 'anthropic' | 'whisper') => {
      try {
        const has = hasAPIKey(provider);
        return { success: true, data: has };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.handle(IPC.STORE_CLEAR_API_KEYS, () => {
    try {
      clearAPIKeys();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  console.log('Store IPC handlers registered');
}
