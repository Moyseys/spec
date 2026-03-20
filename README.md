# Ghost AI - Assistente Desktop com Ollama

Assistente de IA desktop minimalista construído com Electron, React e TypeScript, com integração nativa ao Ollama para modelos de linguagem locais.

## Recursos Implementados

### Fase 1 - Fundação
- Estrutura Electron + React + TypeScript
- UI translúcida estilo glassmorphism
- Design minimalista preto inspirado no Perssua
- Sistema de build com electron-vite

### Fase 2 - Segurança e Configurações
- Encriptação dupla de API keys (safeStorage + electron-store)
- Sistema de armazenamento persistente e seguro
- Interface de configurações completa
- Suporte para múltiplos providers (Ollama, OpenAI, Anthropic)

### Fase 3 - Integração Ollama + Chat Funcional
- Detecção automática do Ollama
- Listagem de modelos instalados
- Cliente HTTP com streaming NDJSON
- Chat com contexto de conversa (últimas 20 mensagens)
- UI de streaming em tempo real
- Tratamento robusto de erros
- Persistência de conversas
- Badge de modelo ativo
- Botão para limpar histórico

## Pré-requisitos

- Node.js 18+ e npm
- Ollama instalado e rodando (para usar modelos locais)

## Instalação

```bash
# Instalar dependências
npm install

# Modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Como Usar

### 1. Instalar Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Ou baixe em: https://ollama.com
```

### 2. Baixar um modelo

```bash
# Exemplo: modelo llama2
ollama pull llama2

# Outros modelos disponíveis
ollama pull mistral
ollama pull codellama
ollama pull phi
```

### 3. Iniciar o Ghost

```bash
npm run dev
```

### 4. Configurar

1. Clique no ícone de engrenagem (configurações)
2. Selecione "Ollama" como provider
3. Escolha o modelo instalado
4. Clique em "Salvar"

### 5. Conversar

Digite sua mensagem e pressione Enter. O Ghost responderá em tempo real com streaming.

## Atalhos de Teclado

- `Cmd/Ctrl + Shift + Space` - Abrir/fechar janela
- `Enter` - Enviar mensagem
- `Shift + Enter` - Nova linha

## Arquitetura

```
ghost-ai-assistant/
├── main/                    # Processo principal Electron
│   ├── index.ts            # Entry point, window management
│   ├── services/           # Serviços (Ollama client)
│   ├── ipc/                # Handlers IPC
│   └── store/              # Persistência de dados
├── renderer/               # Interface React
│   ├── App.tsx             # Componente principal
│   └── components/         # Componentes UI
├── shared/                 # Código compartilhado
│   └── ipc-channels.ts     # Constantes IPC
└── preload/                # Script preload (ponte segura)
    └── index.ts            # API exposta ao renderer
```

## Tecnologias

- **Electron** - Framework desktop
- **React** - UI framework
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **electron-store** - Persistência
- **Ollama** - Modelos de linguagem locais

## Segurança

- **Context Isolation**: Ativado
- **Sandbox**: Ativado
- **Node Integration**: Desativado
- **Encriptação de API Keys**: safeStorage + electron-store
- **Validação de entrada**: Todas as API keys validadas antes de salvar

## Troubleshooting

### Ollama não conecta

1. Verifique se o Ollama está rodando: `ollama list`
2. Teste a API: `curl http://localhost:11434/api/tags`
3. Reinicie o Ollama: `pkill ollama && ollama serve`

### Build falha

1. Limpe node_modules: `rm -rf node_modules && npm install`
2. Limpe dist: `rm -rf dist`
3. Rebuild: `npm run build`

### Configurações corrompidas

```bash
# macOS
rm -rf ~/Library/Application\ Support/ghost-ai-assistant*

# Linux
rm -rf ~/.config/ghost-ai-assistant*

# Windows
# Deletar pasta em %APPDATA%\ghost-ai-assistant
```

---

# 🚀 Roadmap: Ghost → Perssua

## Visão Geral

O Ghost está evoluindo para se tornar o **Perssua** - um assistente de reuniões completo com IA local, captura de áudio, transcrição automática e análise inteligente de meetings.

**Status Atual:** ✅ Chat funcional com Ollama (Fase 3 completa)

---

## 📋 Fases de Desenvolvimento

### ✅ Fase 1: Fundação (COMPLETA)
**Base Electron + React + TypeScript**

- [x] Estrutura Electron com electron-vite
- [x] UI translúcida com glassmorphism
- [x] Design minimalista preto
- [x] Sistema de build otimizado
- [x] Hot reload para desenvolvimento

**Arquivos principais:**
- `main/index.ts` - Window management
- `renderer/App.tsx` - Interface principal
- `electron.vite.config.ts` - Build config

---

### ✅ Fase 2: Segurança e Configurações (COMPLETA)
**Sistema de API Keys e Configurações**

- [x] Encriptação dupla (safeStorage + electron-store)
- [x] Interface de configurações completa
- [x] Suporte multi-provider (Ollama, OpenAI, Anthropic)
- [x] Validação de inputs
- [x] Persistência segura

**Arquivos principais:**
- `main/store/index.ts` - Electron store
- `main/ipc/api-keys.ts` - IPC handlers
- `renderer/components/Settings.tsx` - UI de configurações

**Segurança:**
- Context isolation ativado
- Node integration desativado
- Sandbox mode ativado
- API keys nunca expostas ao renderer

---

### ✅ Fase 3: Integração Ollama + Chat (COMPLETA)
**Chat funcional com modelos locais**

- [x] Detecção automática do Ollama (localhost:11434)
- [x] Listagem de modelos instalados
- [x] Cliente HTTP com `net.fetch()` do Electron
- [x] Streaming NDJSON em tempo real
- [x] Contexto de conversa (últimas 20 mensagens)
- [x] Persistência de conversas (últimas 50)
- [x] UI com typing indicators
- [x] Tratamento de erros robusto
- [x] Badge de status (Conectado/Desconectado)
- [x] Refresh manual de modelos
- [x] System prompt em português

**Arquivos principais:**
- `main/services/ollama.ts` - Ollama HTTP client
- `main/ipc/ollama.ts` - IPC handlers com streaming
- `main/ipc/messages.ts` - Persistência de mensagens
- `renderer/App.tsx` - Chat UI com streaming

**Detalhes Técnicos:**
```typescript
// CRÍTICO: Usar net.fetch() em vez de fetch() no main process
import { net } from 'electron';

const response = await net.fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, messages })
});

// Streaming NDJSON
const reader = response.body.getReader();
const decoder = new TextDecoder();
```

**Modelos Recomendados:**
- `phi:latest` (1.6GB) - Rápido, mas fraco em português
- `mistral:latest` (4.1GB) - **Recomendado** para português
- `llama2:latest` (3.8GB) - Bom balanceamento

---

### 🎙️ Fase 4: Captura de Áudio (PRÓXIMA - MVP Core)
**Gravar reuniões e capturar áudio do sistema**

#### Todo: `audio-device-selection`
**Listar e selecionar dispositivos de entrada**

```typescript
// navigator.mediaDevices.enumerateDevices()
interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

// UI: Dropdown em Settings.tsx
// Armazenar seleção no electron-store
```

**Implementação:**
1. Criar `renderer/hooks/useAudioDevices.ts`
2. Adicionar seção "Dispositivos de Áudio" em Settings.tsx
3. Dropdown com ícones (🎤 mic, 🔊 sistema)
4. Salvar preferência: `store.set('audio.deviceId', deviceId)`

---

#### Todo: `audio-capture`
**MediaRecorder para gravação de áudio**

```typescript
// MediaRecorder API
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    deviceId: selectedDeviceId,
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 48000
  }
});

const recorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
});

recorder.ondataavailable = (event) => {
  chunks.push(event.data);
};

recorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'audio/webm' });
  saveRecording(blob);
};
```

**UI Features:**
- Botão "Iniciar Gravação" / "Parar Gravação"
- Timer ao vivo (HH:MM:SS)
- Indicador visual de áudio (waveform simples)
- Status badge (🔴 Gravando / ⏸️ Pausado)

**Componente:**
- `renderer/components/AudioRecorder.tsx`
- `renderer/hooks/useMediaRecorder.ts`

---

#### Todo: `audio-storage`
**Salvar, listar e gerenciar gravações**

```typescript
// Estrutura de dados
interface Recording {
  id: string;                    // UUID
  filename: string;              // meeting-2024-03-19-143022.webm
  path: string;                  // ~/Documents/Ghost/recordings/
  duration: number;              // segundos
  size: number;                  // bytes
  createdAt: Date;
  transcript?: string;           // Adicionado após transcrição
  summary?: string;              // Adicionado após análise
  tags: string[];
}

// Salvar arquivo
const recordingsPath = path.join(app.getPath('documents'), 'Ghost', 'recordings');
fs.writeFileSync(filePath, buffer);

// Metadata no electron-store
store.set(`recordings.${id}`, metadata);
```

**UI:**
- Lista de gravações em nova aba "Gravações"
- Cards com: título, data, duração, tamanho
- Ações: ▶️ Play, 🗑️ Delete, 📝 Transcribe
- Player de áudio inline
- Search/filter por data ou tags

**Componentes:**
- `renderer/components/RecordingsList.tsx`
- `renderer/components/AudioPlayer.tsx`
- `main/ipc/recordings.ts`

---

### 🎯 Fase 5: Transcrição com Whisper
**Converter áudio em texto com IA**

#### Todo: `whisper-integration`
**Integração com Whisper.cpp ou API OpenAI**

**Opção 1: Whisper Local (whisper.cpp)**
```bash
# Instalar whisper.cpp
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp && make

# Download do modelo
bash ./models/download-ggml-model.sh base

# Transcrever
./main -m models/ggml-base.bin -f recording.wav -l pt
```

**Integração:**
```typescript
// main/services/whisper.ts
import { spawn } from 'child_process';

export async function transcribe(audioPath: string): Promise<string> {
  const whisperPath = '/path/to/whisper.cpp/main';
  const modelPath = '/path/to/models/ggml-base.bin';
  
  const process = spawn(whisperPath, [
    '-m', modelPath,
    '-f', audioPath,
    '-l', 'pt',
    '--output-txt'
  ]);
  
  // Parse output
}
```

**Opção 2: API OpenAI (mais fácil, requer internet)**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream(audioPath),
  model: 'whisper-1',
  language: 'pt'
});
```

**UI:**
- Botão "Transcrever" em cada gravação
- Progress bar durante transcrição
- Editor de texto com transcript
- Timestamps clicáveis (sync com áudio)
- Export para TXT/MD/PDF

**Componentes:**
- `renderer/components/TranscriptEditor.tsx`
- `main/services/whisper.ts`
- `main/ipc/transcription.ts`

---

### 🧠 Fase 6: Análise Inteligente de Reuniões
**Usar Ollama para gerar insights**

#### Todo: `meeting-summary`
**Resumo automático, action items, keywords**

✅ **Status:** implementado no fluxo de gravações (`renderer/App.tsx`) com:
- geração/atualização de resumo por gravação transcrita via `window.ghost.ollama.sendMessage`
- persistência em `recordings[].summary`
- exibição inline (expandir/recolher) e tratamento de erros de Ollama/modelo

**Prompts para Ollama:**

```typescript
// 1. Resumo Executivo
const summaryPrompt = `
Analise a seguinte transcrição de reunião e gere um resumo executivo em português:

TRANSCRIÇÃO:
${transcript}

FORMATO:
# Resumo da Reunião
- Tópicos principais discutidos
- Decisões tomadas
- Próximos passos
`;

// 2. Action Items
const actionItemsPrompt = `
Extraia todos os itens de ação da seguinte transcrição:

TRANSCRIÇÃO:
${transcript}

FORMATO JSON:
{
  "actionItems": [
    {
      "task": "descrição da tarefa",
      "assignee": "pessoa responsável (se mencionado)",
      "deadline": "prazo (se mencionado)",
      "priority": "high|medium|low"
    }
  ]
}
`;

// 3. Sentiment Analysis
const sentimentPrompt = `
Analise o tom e sentimento geral da reunião:

TRANSCRIÇÃO:
${transcript}

FORMATO:
- Sentimento geral: [positivo/neutro/negativo]
- Nível de energia: [alto/médio/baixo]
- Pontos de tensão (se houver)
`;

// 4. Keywords/Tags
const keywordsPrompt = `
Extraia as palavras-chave e tópicos principais:

TRANSCRIÇÃO:
${transcript}

FORMATO: lista de tags separadas por vírgula
`;
```

**Serviço de Análise:**
```typescript
// main/services/analysis.ts
import { sendChatMessage } from './ollama';

export async function analyzeMeeting(transcript: string) {
  const [summary, actionItems, sentiment, keywords] = await Promise.all([
    sendChatMessage(summaryPrompt, 'mistral'),
    sendChatMessage(actionItemsPrompt, 'mistral'),
    sendChatMessage(sentimentPrompt, 'mistral'),
    sendChatMessage(keywordsPrompt, 'mistral')
  ]);
  
  return {
    summary,
    actionItems: JSON.parse(actionItems),
    sentiment,
    keywords: keywords.split(',').map(k => k.trim())
  };
}
```

**UI:**
- Tab "Análise" em cada gravação
- Seções: Resumo, Action Items, Keywords, Sentiment
- Checkboxes para marcar action items como completos
- Export de relatório completo

**Componentes:**
- `renderer/components/MeetingAnalysis.tsx`
- `renderer/components/ActionItemsList.tsx`

---

### 📅 Fase 7: Integração com Calendário
**Conectar com Google Calendar / Outlook**

**Features:**
1. OAuth2 login (Google/Microsoft)
2. Listar próximas reuniões
3. Botão "Gravar esta reunião" inline
4. Auto-associar gravações com eventos
5. Sincronizar action items com tasks

**Implementação:**
```typescript
// Google Calendar API
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);

// Listar eventos
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
const events = await calendar.events.list({
  calendarId: 'primary',
  timeMin: new Date().toISOString(),
  maxResults: 10,
  singleEvents: true,
  orderBy: 'startTime'
});
```

**UI:**
- Nova seção "Calendário" na home
- Lista de reuniões do dia/semana
- Badge de status (🔴 Acontecendo agora / 🕐 Em 1h)
- Click para abrir detalhes + iniciar gravação

---

### 🎨 Fase 8: UI/UX Perssua Completo
**Design profissional e animações**

**Componentes principais:**

1. **Dashboard Home**
   - Reuniões de hoje (calendário)
   - Gravações recentes (últimas 5)
   - Stats: total de horas gravadas, reuniões esta semana

2. **Meeting View**
   - Waveform visual durante gravação
   - Transcript em tempo real (se enabled)
   - Notas manuais inline
   - Timer e status

3. **Recording Details**
   - Player de áudio com controles
   - Transcript com timestamps
   - Análise completa
   - Action items
   - Export options

4. **Search & History**
   - Busca full-text em transcrições
   - Filtros: data, duração, tags, pessoas
   - Timeline view

**Animações (Framer Motion):**
```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {/* content */}
</motion.div>
```

**Temas:**
- Dark mode (padrão - estilo Perssua)
- Light mode (opcional)
- Cores de accent customizáveis

---

### ⚡ Fase 9: Features Avançadas
**Recursos premium e diferenciais**

1. **Multi-idiomas**
   - Auto-detect de idioma (Whisper)
   - Transcrição em qualquer língua
   - Tradução automática

2. **Speaker Diarization**
   - Identificar quem está falando
   - pyannote.audio ou similar
   - Labels: "Speaker 1", "Speaker 2", etc.
   - UI: cores diferentes por speaker

3. **Cloud Sync (opcional)**
   - Supabase backend
   - Sync entre dispositivos
   - Backup automático
   - Sharing links (compartilhar reunião)

4. **Plugins & Extensions**
   - API para plugins
   - Marketplace de extensões
   - Integrações: Slack, Notion, Linear, etc.

5. **Voice Commands**
   - "Iniciar gravação"
   - "Parar e analisar"
   - Hotword detection

6. **Real-time Transcription**
   - Transcrever durante gravação
   - Live captions
   - Websocket para streaming

---

## 🛠️ Stack Técnica Completa

### Core
- **Electron** - Desktop framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Framer Motion** - Animations

### IA & ML
- **Ollama** - Local LLMs (Mistral, Llama2)
- **Whisper.cpp** - Local transcription
- **OpenAI API** - Backup transcription

### Audio
- **MediaRecorder API** - Audio capture
- **Web Audio API** - Waveform visualization
- **Opus codec** - Compression

### Storage
- **electron-store** - Settings & metadata
- **safeStorage** - API key encryption
- **File system** - Audio files

### Calendário
- **Google Calendar API** - Google integration
- **Microsoft Graph API** - Outlook integration

### Cloud (Fase 9)
- **Supabase** - Backend as a service
- **PostgreSQL** - Database
- **Storage** - File hosting

---

## 📊 Estrutura de Dados

### Configurações
```typescript
interface AppConfig {
  // Providers
  providers: {
    ollama: { enabled: boolean; models: string[] };
    openai: { enabled: boolean; apiKey?: string };
  };
  
  // Audio
  audio: {
    deviceId: string;
    sampleRate: 48000 | 44100;
    echoCancellation: boolean;
    noiseSuppression: boolean;
  };
  
  // Transcrição
  transcription: {
    engine: 'whisper-local' | 'openai';
    language: string;
    autoTranscribe: boolean;
  };
  
  // Análise
  analysis: {
    autoAnalyze: boolean;
    model: string; // modelo Ollama para análise
  };
  
  // Calendário
  calendar: {
    provider?: 'google' | 'outlook';
    autoAttach: boolean;
  };
}
```

### Recording
```typescript
interface Recording {
  id: string;
  filename: string;
  path: string;
  duration: number;
  size: number;
  createdAt: Date;
  
  // Metadata
  title?: string;
  tags: string[];
  calendarEventId?: string;
  
  // Processamento
  transcript?: {
    text: string;
    language: string;
    confidence: number;
    segments: Array<{
      text: string;
      start: number;
      end: number;
      speaker?: string;
    }>;
  };
  
  // Análise
  analysis?: {
    summary: string;
    actionItems: ActionItem[];
    keywords: string[];
    sentiment: {
      overall: 'positive' | 'neutral' | 'negative';
      energy: 'high' | 'medium' | 'low';
    };
  };
}

interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  deadline?: Date;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}
```

---

## 🎯 MVP (Minimum Viable Product)

**Objetivo:** Assistente de reuniões funcional em 3 fases

### MVP = Fase 4 + 5 + 6
1. ✅ **Gravar áudio** (Fase 4)
2. ✅ **Transcrever** (Fase 5)
3. ✅ **Analisar** (Fase 6)

**Com isso já teremos:**
- Captura de áudio do sistema/mic
- Transcrição automática
- Resumo e action items
- UI básica funcional

**Depois adicionar:**
- Calendário (Fase 7)
- UI refinada (Fase 8)
- Features avançadas (Fase 9)

---

## 🚀 Próximos Passos

### Imediato (Esta Semana)
1. [ ] Implementar `audio-device-selection`
2. [ ] Implementar `audio-capture`
3. [ ] Implementar `audio-storage`

### Curto Prazo (2 semanas)
4. [x] Integrar Whisper
5. [x] Criar análise com Ollama
6. [ ] MVP pronto para uso

### Médio Prazo (1-2 meses)
7. [ ] Integração calendário
8. [ ] UI/UX completo
9. [ ] Beta testing

### Longo Prazo (3+ meses)
10. [ ] Features avançadas
11. [ ] Cloud sync
12. [ ] Mobile app (React Native?)

---

## 📝 Notas de Implementação

### Desafios Técnicos

1. **Whisper.cpp vs OpenAI API**
   - Local: Privacidade total, mas requer setup
   - API: Fácil, mas depende de internet
   - Solução: Suportar ambos

2. **Speaker Diarization**
   - Requer modelo ML adicional (pyannote)
   - Processar em background
   - UI com cores por speaker

3. **Real-time Transcription**
   - Whisper não é otimizado para streaming
   - Alternativa: Vosk (menos preciso, mas rápido)
   - Ou: chunks de 10s + Whisper

4. **Armazenamento**
   - Áudio WebM: ~1MB/minuto
   - Transcrição: ~10KB/minuto
   - 100 reuniões de 1h = ~6GB
   - Solução: Compressão + cleanup automático

### Boas Práticas

1. **Sempre testar com áudio real**
   - Reuniões do Zoom/Google Meet
   - Diferentes microfones
   - Ruído de fundo

2. **Performance**
   - Processar transcrição em background
   - Não bloquear UI durante análise
   - Progress indicators

3. **Privacidade**
   - Tudo local por padrão
   - Cloud opcional e explícito
   - Encriptar gravações sensíveis

4. **Acessibilidade**
   - Atalhos de teclado
   - Screen reader support
   - High contrast mode

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Especialmente em:
- Speaker diarization
- Otimização de performance
- Novos idiomas
- Integrações (Slack, Notion, etc.)

## 📄 Licença

MIT License - uso livre

## 💡 Inspiração

- [Perssua](https://perssua.app) - Design e UX
- [Otter.ai](https://otter.ai) - Transcrição de reuniões
- [Ollama](https://ollama.com) - IA local

---

**Made with ❤️ for better meetings**
