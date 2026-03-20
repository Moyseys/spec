import { STORE_SETTING_KEYS } from '@shared/ipc-channels'
import type { RecordingMetadata } from '@shared/ipc-channels'
import { normalizeRecordings } from '../utils/recording'

export const persistRecordingsMetadata = async (nextRecordings: RecordingMetadata[]) => {
  const result = await window.ghost.setSetting(STORE_SETTING_KEYS.RECORDINGS, nextRecordings)

  if (!result.success) {
    throw new Error(result.error)
  }
}

export const loadRecordingsMetadata = async (): Promise<RecordingMetadata[]> => {
  const result = await window.ghost.getSetting(STORE_SETTING_KEYS.RECORDINGS)

  if (!result.success) {
    throw new Error(result.error)
  }

  return normalizeRecordings(result.data)
}
