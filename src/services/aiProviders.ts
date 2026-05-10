export type APIFormat = 'openai' | 'anthropic';

export interface AIModel {
  id: string;
  name: string;
  contextWindow?: number;
  note?: string; // e.g. "Reasoning" "Fast" "Latest"
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  format: APIFormat;
  models: AIModel[];
  docsUrl: string;
  icon: string;
  placeholder: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  // ──────────────────────────────────────────────────────────
  // OpenAI  (updated May 2026)
  // GPT-5 series + o4/o3 reasoning + GPT-4.1 + legacy
  // ──────────────────────────────────────────────────────────
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    format: 'openai',
    icon: '⬡',
    docsUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
    models: [
      // GPT-5 flagship
      { id: 'gpt-5.5-2026-04-23',    name: 'GPT-5.5',           contextWindow: 256000, note: 'Latest' },
      { id: 'gpt-5.4-2026-03-05',    name: 'GPT-5.4',           contextWindow: 256000 },
      { id: 'gpt-5.4-mini-2026-03-17', name: 'GPT-5.4 Mini',   contextWindow: 128000, note: 'Fast' },
      { id: 'gpt-5.4-nano-2026-03-17', name: 'GPT-5.4 Nano',   contextWindow: 128000, note: 'Fastest' },
      { id: 'gpt-5-2025-08-07',      name: 'GPT-5',             contextWindow: 128000 },
      { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini',        contextWindow: 128000, note: 'Fast' },
      // GPT-4.1
      { id: 'gpt-4.1-2025-04-14',    name: 'GPT-4.1',           contextWindow: 1047576 },
      { id: 'gpt-4.1-mini-2025-04-14', name: 'GPT-4.1 Mini',   contextWindow: 1047576, note: 'Fast' },
      { id: 'gpt-4.1-nano-2025-04-14', name: 'GPT-4.1 Nano',   contextWindow: 1047576, note: 'Fastest' },
      // Reasoning (o-series)
      { id: 'o4-mini-2025-04-16',    name: 'o4-mini',            contextWindow: 200000, note: 'Reasoning' },
      { id: 'o3-2025-04-16',         name: 'o3',                 contextWindow: 200000, note: 'Reasoning' },
      { id: 'o3-mini-2025-01-31',    name: 'o3-mini',            contextWindow: 200000, note: 'Reasoning Fast' },
      { id: 'o1-2024-12-17',         name: 'o1',                 contextWindow: 200000, note: 'Reasoning' },
      // Legacy GPT-4o
      { id: 'gpt-4o-2024-11-20',     name: 'GPT-4o (Nov 2024)', contextWindow: 128000 },
      { id: 'gpt-4o-mini-2024-07-18', name: 'GPT-4o Mini',      contextWindow: 128000, note: 'Budget' },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // Anthropic  (updated May 2026)
  // Claude 4.x Opus/Sonnet/Haiku series
  // ──────────────────────────────────────────────────────────
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    format: 'anthropic',
    icon: '◈',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...',
    models: [
      { id: 'claude-opus-4-7',              name: 'Claude Opus 4.7',    contextWindow: 200000, note: 'Latest · Frontier' },
      { id: 'claude-sonnet-4-6',            name: 'Claude Sonnet 4.6',  contextWindow: 200000, note: 'Speed + Intelligence' },
      { id: 'claude-haiku-4-5-20251001',    name: 'Claude Haiku 4.5',   contextWindow: 200000, note: 'Fastest' },
      { id: 'claude-opus-4-5-20251101',     name: 'Claude Opus 4.5',    contextWindow: 200000 },
      { id: 'claude-sonnet-4-5-20250929',   name: 'Claude Sonnet 4.5',  contextWindow: 200000 },
      { id: 'claude-opus-4-20250514',       name: 'Claude Opus 4',      contextWindow: 200000 },
      { id: 'claude-sonnet-4-20250514',     name: 'Claude Sonnet 4',    contextWindow: 200000, note: 'Extended Thinking' },
      { id: 'claude-3-haiku-20240307',      name: 'Claude 3 Haiku',     contextWindow: 200000, note: 'Legacy · Budget' },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // DeepSeek  (updated May 2026)
  // DeepSeek-V3-0324 + R1 reasoning
  // ──────────────────────────────────────────────────────────
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    format: 'openai',
    icon: '◉',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    placeholder: 'sk-...',
    models: [
      { id: 'deepseek-chat',     name: 'DeepSeek-V3',  contextWindow: 64000, note: 'Latest (0324)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1',  contextWindow: 64000, note: 'Reasoning' },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // Kimi / Moonshot  (updated May 2026)
  // kimi-k2 is their flagship long-context model
  // ──────────────────────────────────────────────────────────
  {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    baseUrl: 'https://api.moonshot.cn/v1',
    format: 'openai',
    icon: '☽',
    docsUrl: 'https://platform.moonshot.cn/console/api-keys',
    placeholder: 'sk-...',
    models: [
      { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', contextWindow: 128000, note: 'Recommended' },
      { id: 'moonshot-v1-32k',  name: 'Moonshot v1 32K',  contextWindow: 32000 },
      { id: 'moonshot-v1-8k',   name: 'Moonshot v1 8K',   contextWindow: 8000,  note: 'Fast' },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // Qwen / Alibaba Cloud  (updated May 2026)
  // Qwen3 series (2025), Qwen-Long, QwQ reasoning
  // ──────────────────────────────────────────────────────────
  {
    id: 'qwen',
    name: 'Qwen (Alibaba)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    format: 'openai',
    icon: '◆',
    docsUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
    placeholder: 'sk-...',
    models: [
      { id: 'qwen3-235b-a22b',  name: 'Qwen3-235B (MoE)',    contextWindow: 131072, note: 'Latest · MoE' },
      { id: 'qwen3-32b',        name: 'Qwen3-32B',           contextWindow: 131072, note: 'Hybrid Thinking' },
      { id: 'qwen3-14b',        name: 'Qwen3-14B',           contextWindow: 131072 },
      { id: 'qwen3-8b',         name: 'Qwen3-8B',            contextWindow: 131072, note: 'Fast' },
      { id: 'qwq-32b',          name: 'QwQ-32B',             contextWindow: 131072, note: 'Reasoning' },
      { id: 'qwen-max',         name: 'Qwen-Max',            contextWindow: 32000 },
      { id: 'qwen-plus',        name: 'Qwen-Plus',           contextWindow: 131072 },
      { id: 'qwen-long',        name: 'Qwen-Long',           contextWindow: 10000000, note: '10M ctx' },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // Groq  (updated May 2026)
  // Meta Llama 4 + Llama 3.x + Gemma 3
  // ──────────────────────────────────────────────────────────
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    format: 'openai',
    icon: '⚡',
    docsUrl: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    models: [
      { id: 'meta-llama/llama-4-maverick-17b-128e-instruct',  name: 'Llama 4 Maverick 17B',    contextWindow: 131072, note: 'Latest' },
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct',      name: 'Llama 4 Scout 17B',        contextWindow: 131072, note: 'Fast' },
      { id: 'llama-3.3-70b-versatile',                         name: 'Llama 3.3 70B',            contextWindow: 128000 },
      { id: 'llama-3.1-8b-instant',                            name: 'Llama 3.1 8B',             contextWindow: 128000, note: 'Fastest' },
      { id: 'deepseek-r1-distill-llama-70b',                   name: 'DeepSeek-R1 (Llama 70B)',  contextWindow: 128000, note: 'Reasoning' },
      { id: 'gemma2-9b-it',                                    name: 'Gemma 2 9B',               contextWindow: 8192 },
      { id: 'qwen-qwq-32b',                                    name: 'QwQ 32B',                  contextWindow: 128000, note: 'Reasoning' },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // Together AI  (updated May 2026)
  // Llama 4 + Llama 3.3 + DeepSeek R1 + Qwen 2.5
  // ──────────────────────────────────────────────────────────
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    format: 'openai',
    icon: '⊕',
    docsUrl: 'https://api.together.ai/settings/api-keys',
    placeholder: '...',
    models: [
      { id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', name: 'Llama 4 Maverick 17B',    contextWindow: 524288, note: 'Latest' },
      { id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',          name: 'Llama 4 Scout 17B',        contextWindow: 524288, note: 'Fast' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',            name: 'Llama 3.3 70B Turbo',      contextWindow: 128000 },
      { id: 'deepseek-ai/DeepSeek-R1',                             name: 'DeepSeek-R1 671B',         contextWindow: 64000,  note: 'Reasoning' },
      { id: 'deepseek-ai/DeepSeek-V3',                             name: 'DeepSeek-V3',              contextWindow: 64000 },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',                    name: 'Qwen 2.5 72B',             contextWindow: 32768 },
      { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',               name: 'Mixtral 8x22B',            contextWindow: 65536 },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // Google Gemini  (NEW — added May 2026)
  // ──────────────────────────────────────────────────────────
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    format: 'openai',
    icon: '✦',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIza...',
    models: [
      { id: 'gemini-2.5-pro-preview-05-06',   name: 'Gemini 2.5 Pro',    contextWindow: 1048576, note: 'Latest · 1M ctx' },
      { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash',  contextWindow: 1048576, note: 'Fast · 1M ctx' },
      { id: 'gemini-2.0-flash',               name: 'Gemini 2.0 Flash',  contextWindow: 1048576, note: 'Multimodal' },
      { id: 'gemini-2.0-flash-lite',          name: 'Gemini 2.0 Flash Lite', contextWindow: 1048576, note: 'Budget' },
      { id: 'gemini-1.5-pro',                 name: 'Gemini 1.5 Pro',    contextWindow: 2097152 },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // Custom  (OpenAI-compatible, e.g. Ollama, LM Studio)
  // ──────────────────────────────────────────────────────────
  {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    format: 'openai',
    icon: '⚙',
    docsUrl: '',
    placeholder: 'Bearer token or API key',
    models: [
      { id: 'custom-model', name: 'Custom model (enter below)' },
    ],
  },
];

export function getProvider(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}
