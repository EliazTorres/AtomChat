<div align="center">
  <img src="https://img.shields.io/badge/Atom_AI-v4.1.0-5e5ce6?style=for-the-badge&logo=atom&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite&logoColor=white" />
</div>

<br />

<div align="center">
  <h1>⬡ Atom AI</h1>
  <p><strong>A production-ready, Obsidian-inspired AI chat workspace</strong></p>
  <p>Multi-provider · Streaming · Persistent · Markdown · Dark/Light themes</p>
</div>

---

## ✨ Features

### 🤖 Multi-Provider AI Support
| Provider | Models |
|---|---|
| **OpenAI** | GPT-5.5, GPT-5.4, GPT-4.1, o4-mini, o3 (2026) |
| **Anthropic** | Claude Opus 4.7, Sonnet 4.6, Haiku 4.5 (2026) |
| **Google Gemini** | Gemini 2.5 Pro/Flash (1M context) |
| **DeepSeek** | DeepSeek-V3, DeepSeek-R1 |
| **Groq** | Llama 4 Maverick/Scout, QwQ-32B |
| **Together AI** | Llama 4, DeepSeek full 671B |
| **Qwen** | Qwen3-235B MoE, QwQ-32B, Qwen-Long (10M ctx) |
| **Kimi (Moonshot)** | Moonshot v1 128K |
| **Custom** | Any OpenAI-compatible endpoint (Ollama, LM Studio…) |

### 💬 Chat Experience
- **Real-time streaming** — token-by-token response with animated cursor
- **Markdown rendering** — full GFM support via `react-markdown`
- **Syntax highlighting** — 100+ languages with `react-syntax-highlighter` (oneDark theme)
- **Edit messages** — click ✏ on any user message to edit inline and regenerate
- **Regenerate** — retry the last AI response with one click
- **Message feedback** — 👍/👎 on AI responses
- **Copy** — copy any message or code block independently
- **Export** — export any conversation as `.md`

### 🎨 Interface
- **Obsidian-inspired dark theme** + full **light theme**
- **Instant theme toggle** button in the top bar (☀️/🌙)
- **Responsive** — mobile-first sidebar with hamburger menu
- **Token counter** — real-time context window usage bar with color alerts
- **Keyboard shortcuts** — press `?` to view all shortcuts

### 📁 Workspace
- **Persistent conversations** — stored in `localStorage`, survive refreshes
- **Pin & organize** — pin important chats, rename inline with double-click
- **Search** — `Cmd+K` global search across all conversations and messages
- **History page** — full conversation list with date groups, filters, and search
- **Import/Export** — export all conversations as JSON, import them back

### ✨ Power Features
- **Enhance Prompt** — `✨ Enhance` button rewrites your draft with AI (streaming)
- **System prompt** — fully configurable per-session system prompt in Settings
- **File attachments** — attach `.txt`, `.md`, `.json`, `.ts`, `.py` and 20+ file types
- **Drag & drop** — drop files directly onto the composer
- **Context truncation** — smart history trimming to stay within model limits
- **Welcome composer** — rich input with `@tags`, file upload, and drag & drop

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- API key from any supported provider

### Install & Run

```bash
# Clone the repo
git clone https://github.com/your-username/atom-ai.git
cd atom-ai

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and configure your API key in **Settings**.

### Production Build

```bash
npm run build
npm run preview  # preview the production build locally
```

---

## ⚙️ Configuration

All settings are stored in your browser's `localStorage` — nothing leaves your device except the API calls you make.

| Setting | Description |
|---|---|
| **Provider** | Select from 9 supported AI providers |
| **API Key** | Stored locally, never sent to our servers |
| **Model** | Choose from the full model catalog for each provider |
| **System Prompt** | Customize the AI's personality and behavior |
| **Theme** | Dark or Light mode |
| **Custom Endpoint** | Point to your own OpenAI-compatible server |

---

## 🏗️ Architecture

```
src/
├── components/          # Reusable UI components
│   ├── MessageBubble    # Markdown + syntax highlighting + inline edit
│   ├── MessageInput     # Textarea + token counter + Enhance Prompt
│   ├── Sidebar          # Navigation + recent chats + search modal
│   ├── TopBar           # Page header + theme toggle + actions
│   └── ShortcutsModal   # Keyboard shortcuts reference
├── context/
│   ├── ChatContext      # Conversations + streaming + localStorage
│   ├── SettingsContext  # Provider config + theme + persistence
│   └── WorkspacesContext
├── pages/
│   ├── WelcomePage      # Rich composer + @tag prompts + file upload
│   ├── ChatPage         # Main chat view
│   ├── HistoryPage      # Conversation browser
│   └── SettingsPage     # Provider + model + appearance + data
├── services/
│   ├── aiService        # Streaming + provider abstraction
│   └── aiProviders      # 9 providers with full 2026 model catalogs
└── constants/
    └── suggestedPrompts # Prompt card templates
```

### Key Design Decisions
- **No backend required** — Vite dev proxy handles CORS in dev; direct API calls in production
- **Streaming via SSE** — native `fetch` + `ReadableStream` for all providers
- **CSS Modules** — scoped styles, no Tailwind, no CSS-in-JS
- **TanStack Router** — type-safe file-based routing
- **localStorage** — simple persistence; can be migrated to IndexedDB for scale

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Cmd/Ctrl + K` | Open global search |
| `?` | Show shortcuts panel |
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Esc` | Close modals |
| Double-click title | Rename conversation inline |
| Hover message | Show edit / copy / feedback buttons |

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `react` 19 | UI framework |
| `@tanstack/react-router` | Type-safe routing |
| `react-markdown` | Markdown rendering |
| `remark-gfm` | GitHub-flavored Markdown |
| `react-syntax-highlighter` | Code block highlighting |
| `vite` 6 | Build tool + dev server |
| `typescript` 5 | Type safety |

---

## 📄 License

MIT © 2026 Atom AI — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  <p>Built with ❤️ using React + TypeScript + Vite</p>
</div>
