# Spec - AI Meeting Assistant Roadmap

## Current Status
✅ **Base Ghost Architecture Complete**
- Electron main process with tray + global shortcuts
- React renderer with glassmorphism UI
- Secure IPC communication (typed channels)
- TailwindCSS styling
- Development environment ready

## Transformation: Ghost → Spec

### Phase 1: Infrastructure ✅ (Already Complete)
The Ghost project provides our foundation:
- ✅ Electron + TypeScript + React
- ✅ Popup window system
- ✅ IPC architecture
- ✅ Build system (electron-vite + electron-builder)

### Phase 2: Audio Capture (NEXT)
Transform Ghost into a meeting assistant by adding:
- [ ] Audio capture from system (macOS: ScreenCaptureKit)
- [ ] Audio stream processing
- [ ] Audio buffer management
- [ ] Permission handling

### Phase 3: Transcription Integration
- [ ] API key storage (electron-store with encryption)
- [ ] Whisper API integration for speech-to-text
- [ ] Real-time transcription display
- [ ] Speaker detection

### Phase 4: AI Meeting Assistant
Replace Ollama with multi-provider AI:
- [ ] User-provided API keys (OpenAI, Anthropic, etc)
- [ ] Context management from transcription
- [ ] Real-time suggestions engine
- [ ] Objection detection
- [ ] Sentiment analysis

### Phase 5: Meeting Features
- [ ] Meeting recording/storage
- [ ] Summary generation
- [ ] Export functionality
- [ ] Meeting history

### Phase 6: Polish
- [ ] Cross-platform audio (Windows, Linux)
- [ ] Settings UI
- [ ] Keyboard shortcuts customization
- [ ] Error handling & logging

## Architecture Changes

### From Ghost (AI Chat)
```
User Input → Ollama (local) → Streaming Response
```

### To Spec (Meeting Assistant)
```
System Audio → Transcription (Whisper API) → Context → AI (User's API) → Suggestions
```

## File Structure Additions

```
main/
  audio/              # NEW: Audio capture & processing
    capture.ts        # System audio capture
    processor.ts      # Audio stream processing
    types.ts          # Audio-related types
  
  ai/                 # MODIFY: From Ollama to API-based
    client.ts         # Multi-provider AI client (OpenAI, Anthropic)
    agent.ts          # Meeting context + suggestions
    transcription.ts  # Whisper API integration
  
  store/              # NEW: Settings management
    index.ts          # electron-store with API keys
    
renderer/
  components/         # MODIFY: From chat to meeting assistant
    MeetingPanel.tsx  # Main panel
    TranscriptView.tsx
    SuggestionsList.tsx
    SettingsModal.tsx
```

## Development Principles (GEMINI.md)
- ✅ TypeScript strict mode everywhere
- ✅ No `any` types
- ✅ IPC channels as typed constants
- ✅ Fail fast & loud (explicit error handling)
- ✅ Result pattern for errors: `{ success: boolean; data?: T; error?: string }`
- ✅ Performance-first UI (<150ms animations)

## Next Immediate Steps
1. Create audio capture module for macOS
2. Set up electron-store for API key management
3. Integrate Whisper API for transcription
4. Update UI from chat to meeting assistant layout
