import type { GhostAPI } from '@shared/ipc-channels'

declare global {
  interface Window {
    ghost: GhostAPI
  }
}

export {}
