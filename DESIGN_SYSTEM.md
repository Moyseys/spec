# 🎨 Ghost Design System - Guia de Uso

## Componentes Disponíveis

### Button
Botão com 4 variantes e micro-interações.

```tsx
import { Button } from './components/ui'

<Button variant="primary" size="md" loading={false}>
  Enviar
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: React.ReactNode
- `loading`: boolean
- Suporta todos props nativos de `<button>`

**Micro-interações:**
- `whileHover`: scale 1.02
- `whileTap`: scale 0.98
- Animação de loading com spinner

---

### Input
Campo de input com suporte a ícones e erros.

```tsx
import { Input } from './components/ui'

<Input
  type="text"
  placeholder="Digite algo..."
  icon={<SearchIcon />}
  error="Campo obrigatório"
/>
```

**Props:**
- `icon`: React.ReactNode
- `error`: string
- Suporta todos props nativos de `<input>`

---

### Card
Card com compound components e glassmorphism.

```tsx
import { Card } from './components/ui'

<Card variant="glass" hover={true}>
  <Card.Header>
    <Card.Title>Título</Card.Title>
    <Card.Description>Descrição</Card.Description>
  </Card.Header>
  <Card.Content>
    Conteúdo principal
  </Card.Content>
  <Card.Footer>
    <Button>Ação</Button>
  </Card.Footer>
</Card>
```

**Variants:**
- `default`: bg-white/5 + backdrop-blur-xl
- `glass`: gradient + backdrop-blur-2xl + shadow
- `solid`: bg-ghost-bg-secondary

**Hover:** Quando `hover={true}`, aplica scale 1.02 e translateY -2px

---

### Badge
Badge para status e labels.

```tsx
import { Badge } from './components/ui'

<Badge variant="success" size="sm">
  Conectado
</Badge>
```

**Variants:**
- `default`: neutro
- `success`: verde
- `warning`: amarelo
- `error`: vermelho
- `info`: azul
- `accent`: violet (marca Ghost)

---

### Modal
Modal com backdrop blur e animações.

```tsx
import { Modal } from './components/ui'

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Configurações"
  description="Gerencie suas preferências"
  size="lg"
>
  <div>Conteúdo do modal</div>
</Modal>
```

**Sizes:** 'sm' | 'md' | 'lg' | 'xl'

**Animações:**
- Backdrop: fadeIn/fadeOut
- Modal: scaleIn + slideUp

---

### MessageBubble
Componente de mensagem com avatar e animações.

```tsx
import { MessageBubble } from './components/ui'

<MessageBubble
  role="user"
  content="Olá!"
  isStreaming={false}
/>
```

**Props:**
- `role`: 'user' | 'assistant'
- `content`: string
- `isStreaming`: boolean (mostra cursor pulsante)

**Features:**
- Avatar com iniciais (U/G)
- Hover effect: translateX 4px
- Streaming cursor animado

---

### TypingIndicator
Indicador de digitação animado.

```tsx
import { TypingIndicator } from './components/ui'

<TypingIndicator />
```

**Animação:**
- 3 dots com bounce staggered
- Texto "Ghost está pensando..."

---

### EmptyState
Estado vazio com ícone e texto.

```tsx
import { EmptyState } from './components/ui'

<EmptyState
  title="Nenhuma mensagem"
  description="Comece uma conversa agora"
  icon={<CustomIcon />}
/>
```

**Features:**
- Ícone com gradient accent + shadow
- Hover: scale + rotate
- Layout centralizado

---

## Paleta de Cores

### Cores Principais
```css
ghost-bg-primary: #0a0a0a
ghost-bg-secondary: #141414
ghost-bg-tertiary: #1a1a1a

ghost-accent-primary: #7c3aed (violet-600)
ghost-accent-secondary: #a78bfa (violet-400)
ghost-accent-tertiary: #ddd6fe (violet-200)
```

### Status
```css
ghost-status-success: #10b981
ghost-status-warning: #f59e0b
ghost-status-error: #ef4444
ghost-status-info: #3b82f6
```

### Glassmorphism
```css
ghost-glass-100: rgba(255, 255, 255, 0.05)
ghost-glass-200: rgba(255, 255, 255, 0.08)
ghost-glass-300: rgba(255, 255, 255, 0.12)
ghost-glass-400: rgba(255, 255, 255, 0.16)
ghost-glass-500: rgba(255, 255, 255, 0.20)
```

### Borders
```css
ghost-border-subtle: rgba(255, 255, 255, 0.06)
ghost-border-default: rgba(255, 255, 255, 0.10)
ghost-border-strong: rgba(255, 255, 255, 0.20)
```

### Text
```css
ghost-text-primary: #ffffff
ghost-text-secondary: #a1a1aa (zinc-400)
ghost-text-tertiary: #71717a (zinc-500)
ghost-text-muted: #52525b (zinc-600)
```

---

## Gradientes

### Background
```tsx
className="bg-gradient-ghost"
// linear-gradient(135deg, #0a0a0a 0%, #141414 100%)
```

### Accent
```tsx
className="bg-gradient-accent"
// linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)
```

### Glass
```tsx
className="bg-gradient-glass"
// linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)
```

---

## Utilities Classes

### Glassmorphism
```tsx
className="glass" // bg-white/5 + backdrop-blur-2xl + border
className="glass-strong" // bg-white/10 + backdrop-blur-3xl
```

### Interactive
```tsx
className="interactive" // hover:scale-102 + active:scale-98
```

### Focus Ring
```tsx
className="focus-ring" // ring-2 ring-ghost-accent-primary/50
```

---

## Motion Presets

```tsx
import { fadeIn, slideUp, scaleIn, staggerChildren } from './utils/motionPresets'

<motion.div
  variants={slideUp}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Content
</motion.div>
```

**Presets disponíveis:**
- `fadeIn`: opacity 0→1
- `slideUp`: opacity + translateY(20→0)
- `slideDown`: opacity + translateY(-20→0)
- `scaleIn`: opacity + scale(0.95→1)
- `staggerChildren`: stagger 0.1s entre children

**Transitions:**
- `smooth`: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
- `spring`: { type: 'spring', stiffness: 300, damping: 30 }
- `bounce`: { type: 'spring', stiffness: 400, damping: 10 }

---

## Tipografia

### Font Family
```css
font-sans → Inter, system-ui
font-mono → JetBrains Mono, Menlo
```

### Scale
```tsx
text-xs   // 12px
text-sm   // 14px
text-base // 16px
text-lg   // 18px
text-xl   // 20px
text-2xl  // 24px
text-3xl  // 30px
text-4xl  // 36px
```

### Weight
```tsx
font-normal   // 400
font-medium   // 500
font-semibold // 600
font-bold     // 700
```

---

## Shadows

```tsx
shadow-glass      // glassmorphism shadow
shadow-accent     // violet glow pequeno
shadow-accent-lg  // violet glow grande
```

---

## Animações CSS

```tsx
animate-fade-in  // fadeIn 0.2s
animate-slide-up // slideUp 0.3s
animate-scale-in // scaleIn 0.2s
```

---

## Boas Práticas

### 1. Use componentes, não Tailwind puro
❌ Ruim:
```tsx
<button className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded">
  Click
</button>
```

✅ Bom:
```tsx
<Button variant="primary">Click</Button>
```

### 2. Use motion presets
❌ Ruim:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
```

✅ Bom:
```tsx
<motion.div variants={slideUp} initial="initial" animate="animate">
```

### 3. Use cn() para merge de classes
❌ Ruim:
```tsx
className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
```

✅ Bom:
```tsx
className={cn(baseClass, isActive && activeClass, !isActive && inactiveClass)}
```

### 4. Compound components para flexibilidade
❌ Ruim:
```tsx
<Card title="Título" description="Descrição" footer={<Button>...</Button>}>
```

✅ Bom:
```tsx
<Card>
  <Card.Header>
    <Card.Title>Título</Card.Title>
    <Card.Description>Descrição</Card.Description>
  </Card.Header>
  <Card.Footer><Button>...</Button></Card.Footer>
</Card>
```

---

## Changelog

### v1.0.0 (2026-03-19)
- ✅ Design tokens Ghost (paleta violet)
- ✅ Componentes base (Button, Input, Card, Badge, Modal)
- ✅ Framer Motion presets
- ✅ MessageBubble, TypingIndicator, EmptyState
- ✅ Micro-interações (whileHover, whileTap)
- ✅ Glassmorphism utilities
- ✅ Gradientes customizados
- ✅ Inter font integration
- ✅ Build otimizado (625KB)

---

**Made with ❤️ for Ghost AI**
