"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const Store = require("electron-store");
const STORE_SETTING_KEYS = {
  DEFAULT_AI_PROVIDER: "defaultAIProvider",
  DEFAULT_MODEL: "defaultModel",
  OLLAMA_MODEL: "ollamaModel",
  AUDIO_DEVICE_ID: "audio.deviceId",
  RECORDINGS: "recordings",
  SHORTCUT: "shortcut",
  WINDOW_WIDTH: "windowWidth",
  WINDOW_HEIGHT: "windowHeight",
  TEMPERATURE: "temperature",
  THEME: "theme",
  LANGUAGE: "language"
};
const KNOWN_STORE_SETTING_KEY_SET = new Set(Object.values(STORE_SETTING_KEYS));
const isStoreSettingKey = (key) => KNOWN_STORE_SETTING_KEY_SET.has(key);
const IPC = {
  // AI Operations
  AI_SEND_MESSAGE: "ai:sendMessage",
  AI_STREAM_CHUNK: "ai:streamChunk",
  AI_CLEAR_HISTORY: "ai:clearHistory",
  AI_LIST_MODELS: "ai:listModels",
  // Ollama Operations
  OLLAMA_CHECK_STATUS: "ollama:checkStatus",
  OLLAMA_LIST_MODELS: "ollama:listModels",
  OLLAMA_SEND_MESSAGE: "ollama:sendMessage",
  OLLAMA_STOP_GENERATION: "ollama:stopGeneration",
  // Window Management
  WINDOW_HIDE: "window:hide",
  WINDOW_TOGGLE: "window:toggle",
  WINDOW_READY: "window:ready",
  // Configuration & Settings
  STORE_GET: "store:get",
  STORE_SET: "store:set",
  STORE_GET_API_KEY: "store:getApiKey",
  STORE_SET_API_KEY: "store:setApiKey",
  STORE_HAS_API_KEY: "store:hasApiKey",
  STORE_CLEAR_API_KEYS: "store:clearApiKeys",
  // Messages
  MESSAGES_SAVE: "messages:save",
  MESSAGES_GET_LAST: "messages:getLast",
  MESSAGES_CLEAR: "messages:clear",
  // Audio Capture (future)
  AUDIO_START_CAPTURE: "audio:startCapture",
  AUDIO_STOP_CAPTURE: "audio:stopCapture",
  AUDIO_GET_DEVICES: "audio:getDevices",
  // Transcription (future)
  TRANSCRIPTION_TRANSCRIBE: "transcription:transcribe",
  TRANSCRIPTION_START: "transcription:start",
  TRANSCRIPTION_STOP: "transcription:stop",
  TRANSCRIPTION_CHUNK: "transcription:chunk"
};
const defaults = {
  recordings: [],
  shortcut: "CommandOrControl+Shift+Space",
  windowWidth: 720,
  windowHeight: 680,
  defaultAIProvider: "ollama",
  defaultModel: "llama3",
  temperature: 0.7,
  theme: "dark",
  language: "pt"
};
const store = new Store({
  defaults,
  encryptionKey: process.env.ENCRYPTION_KEY || "ghost-ai-assistant-v1"
});
function encryptKey(plainText) {
  if (!electron.safeStorage.isEncryptionAvailable()) {
    console.warn("Encryption not available, storing in plain text (DEV only)");
    return Buffer.from(plainText).toString("base64");
  }
  const encrypted = electron.safeStorage.encryptString(plainText);
  return encrypted.toString("base64");
}
function decryptKey(encryptedBase64) {
  if (!electron.safeStorage.isEncryptionAvailable()) {
    return Buffer.from(encryptedBase64, "base64").toString();
  }
  const buffer = Buffer.from(encryptedBase64, "base64");
  return electron.safeStorage.decryptString(buffer);
}
function getConfig(key) {
  return store.get(key);
}
function setConfig(key, value) {
  store.set(key, value);
}
function setAPIKey(provider, key) {
  if (!key || key.trim().length === 0) {
    return { success: false, error: "API key não pode ficar vazia." };
  }
  const trimmedKey = key.trim();
  if (trimmedKey.length < 10) {
    return { success: false, error: "API key muito curta. Verifique o valor informado." };
  }
  const keyMap = {
    openai: "openaiApiKey",
    anthropic: "anthropicApiKey",
    whisper: "whisperApiKey"
  };
  try {
    const encrypted = encryptKey(trimmedKey);
    store.set(keyMap[provider], encrypted);
    return { success: true };
  } catch (err) {
    console.error(`Error saving API key for ${provider}:`, err);
    return { success: false, error: err.message };
  }
}
function getAPIKey(provider) {
  const keyMap = {
    openai: "openaiApiKey",
    anthropic: "anthropicApiKey",
    whisper: "whisperApiKey"
  };
  try {
    const encrypted = store.get(keyMap[provider]);
    if (!encrypted) return void 0;
    return decryptKey(encrypted);
  } catch (err) {
    console.error(`Error retrieving API key for ${provider}:`, err);
    return void 0;
  }
}
function hasAPIKey(provider) {
  const key = getAPIKey(provider);
  return !!key && key.length > 0;
}
function clearAPIKeys() {
  store.delete("openaiApiKey");
  store.delete("anthropicApiKey");
  store.delete("whisperApiKey");
}
function validateAPIKeyFormat(provider, key) {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, error: "API key vazia." };
  }
  switch (provider) {
    case "openai":
      if (!trimmed.startsWith("sk-")) {
        return { valid: false, error: 'A chave da OpenAI deve começar com "sk-".' };
      }
      if (trimmed.length < 40) {
        return { valid: false, error: "A chave da OpenAI parece curta demais." };
      }
      break;
    case "anthropic":
      if (!trimmed.startsWith("sk-ant-")) {
        return { valid: false, error: 'A chave da Anthropic deve começar com "sk-ant-".' };
      }
      break;
    case "whisper":
      if (!trimmed.startsWith("sk-")) {
        return { valid: false, error: 'A chave para Whisper deve começar com "sk-".' };
      }
      break;
  }
  return { valid: true };
}
const API_PROVIDERS = ["openai", "anthropic", "whisper"];
const DEFAULT_AI_PROVIDERS = ["openai", "anthropic", "ollama"];
const APP_THEMES = ["dark", "light"];
const APP_LANGUAGES = ["pt", "en"];
const FORBIDDEN_STORE_KEY_SEGMENTS = /* @__PURE__ */ new Set(["__proto__", "prototype", "constructor"]);
const OLLAMA_ROLES = /* @__PURE__ */ new Set(["system", "user", "assistant"]);
const CONVERSATION_ROLES = /* @__PURE__ */ new Set(["user", "assistant"]);
function ok(data) {
  return { success: true, data };
}
function fail(error) {
  return { success: false, error };
}
function errorMessageFromUnknown(err, fallback) {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }
  return fallback;
}
function logIpcError(scope, err) {
  console.error(`[IPC:${scope}]`, err);
}
const isRecord$1 = (value) => typeof value === "object" && value !== null;
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isString = (value) => typeof value === "string";
const isOptionalString = (value) => typeof value === "undefined" || typeof value === "string";
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const isArrayBufferLike = (value) => value instanceof ArrayBuffer || Object.prototype.toString.call(value) === "[object ArrayBuffer]";
const isDefaultAIProvider = (value) => typeof value === "string" && DEFAULT_AI_PROVIDERS.includes(value);
const isAppTheme = (value) => typeof value === "string" && APP_THEMES.includes(value);
const isAppLanguage = (value) => typeof value === "string" && APP_LANGUAGES.includes(value);
const isRecordingMetadata = (value) => {
  if (!isRecord$1(value)) {
    return false;
  }
  if (!isNonEmptyString(value.id) || !isFiniteNumber(value.createdAt) || !isFiniteNumber(value.durationMs) || value.durationMs < 0 || !isFiniteNumber(value.size) || value.size < 0 || !isNonEmptyString(value.mimeType)) {
    return false;
  }
  if (!isOptionalString(value.deviceId) || !isOptionalString(value.title) || !isOptionalString(value.transcript) || !isOptionalString(value.summary)) {
    return false;
  }
  return true;
};
function parseStoreKey(value) {
  if (!isNonEmptyString(value)) {
    return { ok: false, error: "Chave de configuração inválida." };
  }
  const key = value.trim();
  if (key.length > 200) {
    return { ok: false, error: "Chave de configuração excede o tamanho permitido." };
  }
  const hasForbiddenSegment = key.split(".").some((segment) => FORBIDDEN_STORE_KEY_SEGMENTS.has(segment));
  if (hasForbiddenSegment) {
    return { ok: false, error: "Chave de configuração contém segmento não permitido." };
  }
  if (!isStoreSettingKey(key)) {
    return { ok: false, error: "Chave de configuração não suportada." };
  }
  return { ok: true, value: key };
}
function parseStoreValue(key, value) {
  switch (key) {
    case STORE_SETTING_KEYS.DEFAULT_AI_PROVIDER:
      if (!isDefaultAIProvider(value)) {
        return { ok: false, error: "Provider padrão inválido." };
      }
      return { ok: true, value };
    case STORE_SETTING_KEYS.DEFAULT_MODEL:
    case STORE_SETTING_KEYS.SHORTCUT:
      if (!isString(value)) {
        return { ok: false, error: "Valor de configuração inválido." };
      }
      return { ok: true, value };
    case STORE_SETTING_KEYS.OLLAMA_MODEL:
    case STORE_SETTING_KEYS.AUDIO_DEVICE_ID:
      if (!isOptionalString(value)) {
        return { ok: false, error: "Valor de configuração inválido." };
      }
      return { ok: true, value };
    case STORE_SETTING_KEYS.WINDOW_WIDTH:
    case STORE_SETTING_KEYS.WINDOW_HEIGHT:
      if (!isFiniteNumber(value) || value <= 0) {
        return { ok: false, error: "Dimensão de janela inválida." };
      }
      return { ok: true, value };
    case STORE_SETTING_KEYS.TEMPERATURE:
      if (!isFiniteNumber(value)) {
        return { ok: false, error: "Temperatura inválida." };
      }
      return { ok: true, value };
    case STORE_SETTING_KEYS.THEME:
      if (!isAppTheme(value)) {
        return { ok: false, error: "Tema inválido." };
      }
      return { ok: true, value };
    case STORE_SETTING_KEYS.LANGUAGE:
      if (!isAppLanguage(value)) {
        return { ok: false, error: "Idioma inválido." };
      }
      return { ok: true, value };
    case STORE_SETTING_KEYS.RECORDINGS:
      if (!Array.isArray(value)) {
        return { ok: false, error: "Lista de gravações inválida." };
      }
      if (!value.every((entry) => isRecordingMetadata(entry))) {
        return { ok: false, error: "Metadados de gravações inválidos." };
      }
      return { ok: true, value };
    default: {
      const exhaustiveCheck = key;
      return exhaustiveCheck;
    }
  }
}
function parseApiProvider(value) {
  if (typeof value !== "string" || !API_PROVIDERS.includes(value)) {
    return { ok: false, error: "Provider de API inválido." };
  }
  return { ok: true, value };
}
function parseConversationMessages(value) {
  if (!Array.isArray(value)) {
    return { ok: false, error: "Payload de mensagens inválido." };
  }
  const normalized = [];
  for (const item of value) {
    if (!isRecord$1(item)) {
      return { ok: false, error: "Mensagem inválida no payload." };
    }
    const role = item.role;
    const content = item.content;
    const timestamp = item.timestamp;
    if (typeof role !== "string" || !CONVERSATION_ROLES.has(role)) {
      return { ok: false, error: "Papel da mensagem inválido." };
    }
    if (typeof content !== "string") {
      return { ok: false, error: "Conteúdo da mensagem inválido." };
    }
    if (typeof timestamp !== "undefined" && (typeof timestamp !== "number" || !Number.isFinite(timestamp))) {
      return { ok: false, error: "Timestamp da mensagem inválido." };
    }
    const normalizedRole = role;
    normalized.push(
      typeof timestamp === "number" ? { role: normalizedRole, content, timestamp } : { role: normalizedRole, content }
    );
  }
  return { ok: true, value: normalized };
}
function parseOllamaMessages(value) {
  if (!Array.isArray(value)) {
    return { ok: false, error: "Payload de contexto do chat inválido." };
  }
  const normalized = [];
  for (const item of value) {
    if (!isRecord$1(item)) {
      return { ok: false, error: "Mensagem inválida no contexto do chat." };
    }
    const role = item.role;
    const content = item.content;
    if (typeof role !== "string" || !OLLAMA_ROLES.has(role)) {
      return { ok: false, error: "Papel da mensagem do chat inválido." };
    }
    if (typeof content !== "string") {
      return { ok: false, error: "Conteúdo da mensagem do chat inválido." };
    }
    const normalizedRole = role;
    normalized.push({ role: normalizedRole, content });
  }
  return { ok: true, value: normalized };
}
function parseModelName(value) {
  if (!isNonEmptyString(value)) {
    return { ok: false, error: "Nome do modelo inválido." };
  }
  return { ok: true, value: value.trim() };
}
function parseApiKey(value) {
  if (!isNonEmptyString(value)) {
    return { ok: false, error: "API key inválida." };
  }
  return { ok: true, value: value.trim() };
}
function parseTranscriptionPayload(value) {
  if (!isRecord$1(value)) {
    return { ok: false, error: "Payload de transcrição inválido." };
  }
  const recordingId = value.recordingId;
  const audioBuffer = value.audioBuffer;
  const mimeType = value.mimeType;
  if (!isNonEmptyString(recordingId)) {
    return { ok: false, error: "Identificador da gravação não informado." };
  }
  if (!isArrayBufferLike(audioBuffer) || audioBuffer.byteLength === 0) {
    return { ok: false, error: "Áudio da gravação não enviado para transcrição." };
  }
  if (typeof mimeType !== "undefined" && typeof mimeType !== "string") {
    return { ok: false, error: "Tipo MIME do áudio inválido." };
  }
  return {
    ok: true,
    value: {
      recordingId: recordingId.trim(),
      audioBuffer,
      mimeType
    }
  };
}
function registerStoreHandlers() {
  electron.ipcMain.handle(IPC.STORE_GET, (_event, keyPayload) => {
    const parsedKey = parseStoreKey(keyPayload);
    if (!parsedKey.ok) {
      return fail(parsedKey.error);
    }
    try {
      return ok(getConfig(parsedKey.value));
    } catch (err) {
      logIpcError(`store:get:${parsedKey.value}`, err);
      return fail(errorMessageFromUnknown(err, "Falha ao carregar configuração."));
    }
  });
  electron.ipcMain.handle(
    IPC.STORE_SET,
    (_event, keyPayload, valuePayload) => {
      const parsedKey = parseStoreKey(keyPayload);
      if (!parsedKey.ok) {
        return fail(parsedKey.error);
      }
      const parsedValue = parseStoreValue(parsedKey.value, valuePayload);
      if (!parsedValue.ok) {
        return fail(parsedValue.error);
      }
      try {
        setConfig(parsedKey.value, parsedValue.value);
        return ok(void 0);
      } catch (err) {
        logIpcError(`store:set:${parsedKey.value}`, err);
        return fail(errorMessageFromUnknown(err, "Falha ao salvar configuração."));
      }
    }
  );
  electron.ipcMain.handle(
    IPC.STORE_SET_API_KEY,
    (_event, providerPayload, keyPayload) => {
      const parsedProvider = parseApiProvider(providerPayload);
      if (!parsedProvider.ok) {
        return fail(parsedProvider.error);
      }
      const parsedKey = parseApiKey(keyPayload);
      if (!parsedKey.ok) {
        return fail(parsedKey.error);
      }
      const validation = validateAPIKeyFormat(parsedProvider.value, parsedKey.value);
      if (!validation.valid) {
        return fail(validation.error || "Formato de API key inválido.");
      }
      const result = setAPIKey(parsedProvider.value, parsedKey.value);
      return result.success ? ok(void 0) : fail(result.error || "Falha ao salvar API key.");
    }
  );
  electron.ipcMain.handle(
    IPC.STORE_GET_API_KEY,
    (_event, providerPayload) => {
      const parsedProvider = parseApiProvider(providerPayload);
      if (!parsedProvider.ok) {
        return fail(parsedProvider.error);
      }
      try {
        const key = getAPIKey(parsedProvider.value);
        return ok(key);
      } catch (err) {
        logIpcError(`store:getApiKey:${parsedProvider.value}`, err);
        return fail(errorMessageFromUnknown(err, "Falha ao carregar API key."));
      }
    }
  );
  electron.ipcMain.handle(
    IPC.STORE_HAS_API_KEY,
    (_event, providerPayload) => {
      const parsedProvider = parseApiProvider(providerPayload);
      if (!parsedProvider.ok) {
        return fail(parsedProvider.error);
      }
      try {
        const has = hasAPIKey(parsedProvider.value);
        return ok(has);
      } catch (err) {
        logIpcError(`store:hasApiKey:${parsedProvider.value}`, err);
        return fail(errorMessageFromUnknown(err, "Falha ao verificar API key."));
      }
    }
  );
  electron.ipcMain.handle(IPC.STORE_CLEAR_API_KEYS, () => {
    try {
      clearAPIKeys();
      return ok(void 0);
    } catch (err) {
      logIpcError("store:clearApiKeys", err);
      return fail(errorMessageFromUnknown(err, "Falha ao limpar API keys."));
    }
  });
  console.log("Store IPC handlers registered");
}
const OLLAMA_BASE_URL = "http://localhost:11434";
async function checkOllamaStatus() {
  try {
    const response = await electron.net.fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      return { running: false, error: `Status ${response.status}` };
    }
    const data = await response.json();
    return {
      running: true,
      version: data.version,
      models: data.models || []
    };
  } catch (err) {
    return { running: false, error: "Ollama offline" };
  }
}
async function listOllamaModels() {
  const status = await checkOllamaStatus();
  return status.running && status.models ? status.models : [];
}
async function sendChatMessage(messages, model = "llama2", stream = false, signal) {
  try {
    const response = await electron.net.fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model,
        messages,
        stream
      })
    });
    if (!response.ok) {
      const error = await response.text();
      if (response.status === 404) {
        throw new Error(`Modelo "${model}" não encontrado. Instale com: ollama pull ${model}`);
      }
      if (response.status >= 500) {
        throw new Error("Ollama indisponível no momento. Tente novamente em instantes.");
      }
      throw new Error(`Falha no Ollama (status ${response.status}): ${error}`);
    }
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Não foi possível conectar ao Ollama. Certifique-se de que está rodando: ollama serve");
    }
    throw err;
  }
}
let currentStream = null;
function registerOllamaHandlers() {
  electron.ipcMain.handle(IPC.OLLAMA_CHECK_STATUS, async () => {
    try {
      const status = await checkOllamaStatus();
      return ok(status);
    } catch (err) {
      logIpcError("ollama:checkStatus", err);
      return fail(errorMessageFromUnknown(err, "Erro ao verificar Ollama"));
    }
  });
  electron.ipcMain.handle(IPC.OLLAMA_LIST_MODELS, async () => {
    try {
      const models = await listOllamaModels();
      return ok(models);
    } catch (err) {
      logIpcError("ollama:listModels", err);
      return fail(errorMessageFromUnknown(err, "Erro ao listar modelos"));
    }
  });
  electron.ipcMain.handle(
    IPC.OLLAMA_SEND_MESSAGE,
    async (event, messagesPayload, modelPayload) => {
      const parsedMessages = parseOllamaMessages(messagesPayload);
      if (!parsedMessages.ok) {
        return fail(parsedMessages.error);
      }
      const parsedModel = parseModelName(modelPayload);
      if (!parsedModel.ok) {
        return fail(parsedModel.error);
      }
      try {
        const streamController = new AbortController();
        currentStream = streamController;
        const response = await sendChatMessage(
          parsedMessages.value,
          parsedModel.value,
          true,
          streamController.signal
        );
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          return fail("O Ollama não disponibilizou um stream de resposta.");
        }
        const window = electron.BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          return fail("Janela principal indisponível para receber a resposta.");
        }
        let fullResponse = "";
        let pendingStreamLine = "";
        const processStreamLine = (line) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            return false;
          }
          const data = JSON.parse(trimmedLine);
          if (data.message?.content) {
            fullResponse += data.message.content;
            window.webContents.send(IPC.AI_STREAM_CHUNK, data.message.content);
          }
          return Boolean(data.done);
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingStreamLine += decoder.decode(value, { stream: true });
          const lines = pendingStreamLine.split("\n");
          pendingStreamLine = lines.pop() || "";
          for (const line of lines) {
            try {
              if (processStreamLine(line)) {
                return ok(fullResponse);
              }
            } catch (parseErr) {
              logIpcError("ollama:sendMessage:parseChunk", parseErr);
              return fail("Falha ao interpretar a resposta em streaming do Ollama.");
            }
          }
        }
        const remainingChunk = pendingStreamLine.trim();
        if (remainingChunk) {
          try {
            if (processStreamLine(remainingChunk)) {
              return ok(fullResponse);
            }
          } catch (parseErr) {
            logIpcError("ollama:sendMessage:parseTrailingChunk", parseErr);
            return fail("Falha ao interpretar a resposta em streaming do Ollama.");
          }
        }
        if (!fullResponse.trim()) {
          return fail("O Ollama não retornou conteúdo para esta solicitação.");
        }
        return ok(fullResponse);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return fail("Geração cancelada.");
        }
        logIpcError("ollama:sendMessage", err);
        return fail(errorMessageFromUnknown(err, "Não foi possível enviar a mensagem ao Ollama."));
      } finally {
        currentStream = null;
      }
    }
  );
  electron.ipcMain.handle(IPC.OLLAMA_STOP_GENERATION, async () => {
    if (currentStream) {
      currentStream.abort();
      currentStream = null;
      return ok(void 0);
    }
    return fail("Nenhuma geração em andamento.");
  });
}
const messagesStore = new Store({
  name: "messages",
  defaults: {
    conversations: []
  }
});
function saveConversation(messages) {
  const conversations = messagesStore.get("conversations", []);
  const id = Date.now().toString();
  const now = Date.now();
  const normalizedMessages = messages.map((message) => ({
    role: message.role,
    content: message.content,
    timestamp: typeof message.timestamp === "number" && Number.isFinite(message.timestamp) ? message.timestamp : now
  }));
  const conversation = {
    id,
    messages: normalizedMessages,
    createdAt: now,
    updatedAt: now
  };
  conversations.unshift(conversation);
  const maxConversations = 50;
  if (conversations.length > maxConversations) {
    conversations.splice(maxConversations);
  }
  messagesStore.set("conversations", conversations);
  return id;
}
function getLastConversation() {
  const conversations = messagesStore.get("conversations", []);
  if (conversations.length === 0) return null;
  return conversations[0].messages.map((message) => ({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp
  }));
}
function clearConversations() {
  messagesStore.set("conversations", []);
}
function registerMessagesHandlers() {
  electron.ipcMain.handle(IPC.MESSAGES_SAVE, async (_event, payload) => {
    const parsedMessages = parseConversationMessages(payload);
    if (!parsedMessages.ok) {
      return fail(parsedMessages.error);
    }
    try {
      const id = saveConversation(parsedMessages.value);
      return ok(id);
    } catch (err) {
      logIpcError("messages:save", err);
      return fail(errorMessageFromUnknown(err, "Erro ao salvar mensagens."));
    }
  });
  electron.ipcMain.handle(
    IPC.MESSAGES_GET_LAST,
    async () => {
      try {
        const messages = getLastConversation();
        return ok(messages);
      } catch (err) {
        logIpcError("messages:getLast", err);
        return fail(errorMessageFromUnknown(err, "Erro ao carregar mensagens."));
      }
    }
  );
  electron.ipcMain.handle(IPC.MESSAGES_CLEAR, async () => {
    try {
      clearConversations();
      return ok(void 0);
    } catch (err) {
      logIpcError("messages:clear", err);
      return fail(errorMessageFromUnknown(err, "Erro ao limpar mensagens."));
    }
  });
}
const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_TRANSCRIPTION_MODEL = "whisper-1";
const isRecord = (value) => typeof value === "object" && value !== null;
const resolveExtensionFromMimeType = (mimeType) => {
  if (!mimeType) return "webm";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("webm")) return "webm";
  return "webm";
};
const extractOpenAIErrorMessage = (rawError) => {
  try {
    const parsed = JSON.parse(rawError);
    if (isRecord(parsed) && "error" in parsed && isRecord(parsed.error)) {
      const nestedMessage = parsed.error.message;
      if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
        return nestedMessage;
      }
    }
    if (isRecord(parsed) && "message" in parsed) {
      const message = parsed.message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
    return null;
  } catch (parseError) {
    console.warn("OpenAI transcription error payload is not valid JSON:", parseError);
    return null;
  }
};
const mapOpenAIStatusToMessage = (status, fallback) => {
  if (status === 401) {
    return "API key da OpenAI inválida ou expirada. Atualize a chave em Configurações.";
  }
  if (status === 429) {
    return "Limite de uso da OpenAI atingido. Aguarde e tente novamente.";
  }
  if (status >= 500) {
    return "A OpenAI está indisponível no momento. Tente novamente em instantes.";
  }
  return fallback || `Falha na transcrição (OpenAI retornou status ${status}).`;
};
async function transcribeAudioWithOpenAI(options) {
  const { apiKey, audioBuffer, mimeType, fileName } = options;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("OpenAI API key não configurada para transcrição.");
  }
  if (!(audioBuffer instanceof ArrayBuffer) || audioBuffer.byteLength === 0) {
    throw new Error("Arquivo de áudio inválido para transcrição.");
  }
  const extension = resolveExtensionFromMimeType(mimeType);
  const safeFileName = fileName && fileName.trim().length > 0 ? fileName.trim() : `gravacao.${extension}`;
  const audioBlob = new Blob([Buffer.from(audioBuffer)], {
    type: mimeType || "audio/webm"
  });
  const formData = new FormData();
  formData.append("model", OPENAI_TRANSCRIPTION_MODEL);
  formData.append("response_format", "text");
  formData.append("language", "pt");
  formData.append("file", audioBlob, safeFileName);
  try {
    const response = await electron.net.fetch(OPENAI_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });
    if (!response.ok) {
      const rawError = await response.text();
      const parsedMessage = extractOpenAIErrorMessage(rawError);
      throw new Error(mapOpenAIStatusToMessage(response.status, parsedMessage || void 0));
    }
    const transcript = (await response.text()).trim();
    if (!transcript) {
      throw new Error("A OpenAI retornou transcrição vazia para este áudio.");
    }
    return transcript;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "TypeError") {
        throw new Error("Falha de rede ao enviar áudio para transcrição. Verifique sua conexão.");
      }
      throw err;
    }
    throw new Error("Erro inesperado ao transcrever áudio.");
  }
}
function registerTranscriptionHandlers() {
  electron.ipcMain.handle(
    IPC.TRANSCRIPTION_TRANSCRIBE,
    async (_event, payload) => {
      const parsedPayload = parseTranscriptionPayload(payload);
      if (!parsedPayload.ok) {
        return fail(parsedPayload.error);
      }
      const { recordingId, audioBuffer, mimeType } = parsedPayload.value;
      try {
        if (!hasAPIKey("openai")) {
          return fail(
            "Transcrição indisponível: configure sua OpenAI API key em Configurações para continuar."
          );
        }
        const openaiApiKey = getAPIKey("openai");
        if (!openaiApiKey) {
          return fail(
            "Transcrição indisponível: não foi possível carregar sua OpenAI API key. Reconfigure em Configurações."
          );
        }
        const transcript = await transcribeAudioWithOpenAI({
          apiKey: openaiApiKey,
          audioBuffer,
          mimeType,
          fileName: `${recordingId}.webm`
        });
        return ok({ recordingId, transcript });
      } catch (err) {
        logIpcError("transcription:transcribe", err);
        return fail(errorMessageFromUnknown(err, "Não foi possível concluir a transcrição do áudio."));
      }
    }
  );
}
let mainWindow = null;
let tray = null;
function createMainWindow() {
  console.log("Criando janela principal...");
  mainWindow = new electron.BrowserWindow({
    width: 720,
    height: 680,
    show: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    vibrancy: "under-window",
    visualEffectState: "active",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.on("blur", () => {
    mainWindow?.hide();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function toggleWindow() {
  if (!mainWindow) {
    createMainWindow();
  }
  if (mainWindow?.isVisible()) {
    mainWindow.hide();
  } else {
    centerOnActiveScreen(mainWindow);
    mainWindow?.show();
    mainWindow?.focus();
  }
}
function centerOnActiveScreen(win) {
  const cursor = electron.screen.getCursorScreenPoint();
  const display = electron.screen.getDisplayNearestPoint(cursor);
  const { x, y, width, height } = display.workArea;
  const [w, h] = win.getSize();
  win.setPosition(
    Math.round(x + (width - w) / 2),
    Math.round(y + (height - h) / 2)
  );
}
function createTray() {
  const icon = electron.nativeImage.createEmpty();
  tray = new electron.Tray(icon);
  const contextMenu = electron.Menu.buildFromTemplate([
    { label: "Mostrar Ghost", click: () => toggleWindow() },
    { type: "separator" },
    { label: "Sair", click: () => electron.app.quit() }
  ]);
  tray.setToolTip("Ghost AI Assistant");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => toggleWindow());
}
electron.app.whenReady().then(() => {
  createMainWindow();
  createTray();
  electron.app.dock.show();
  electron.globalShortcut.register("CommandOrControl+Shift+Space", () => {
    toggleWindow();
  });
  registerStoreHandlers();
  registerOllamaHandlers();
  registerMessagesHandlers();
  registerTranscriptionHandlers();
  electron.ipcMain.on(IPC.WINDOW_HIDE, () => mainWindow?.hide());
  electron.ipcMain.on(IPC.WINDOW_TOGGLE, () => toggleWindow());
});
electron.app.on("window-all-closed", (e) => {
  e.preventDefault();
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
});
