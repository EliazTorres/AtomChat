import type { AIProvider } from './aiProviders';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

/**
 * In dev, all requests go through the Vite /ai-proxy middleware (Node.js, no CORS).
 * The real API base URL is sent in the "x-target-base" header.
 * In prod (built bundle), requests go directly to the provider (needs server-side proxy).
 */
function buildFetch(
  baseUrl: string,
  path: string,
  _apiKey: string,
  extraHeaders: Record<string, string>,
  body: unknown
): Promise<Response> {
  const isDev = import.meta.env.DEV;

  if (isDev && baseUrl) {
    // Route through Vite middleware proxy
    return fetch(`/ai-proxy${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-target-base': baseUrl,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });
  }

  // Production / custom direct call
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

// ── Parse SSE stream ──────────────────────────────────────────
async function readSSEStream(
  response: Response,
  callbacks: StreamCallbacks,
  isAnthropic: boolean
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) { callbacks.onError(new Error('No response body')); return; }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          if (isAnthropic) {
            if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
              callbacks.onChunk(json.delta.text);
            }
          } else {
            const text = json?.choices?.[0]?.delta?.content;
            if (typeof text === 'string' && text) callbacks.onChunk(text);
          }
        } catch { /* skip malformed */ }
      }
    }
  } finally {
    reader.releaseLock();
  }

  callbacks.onDone();
}

// ── Error extractor ───────────────────────────────────────────
async function extractError(response: Response): Promise<string> {
  try {
    const json = await response.json();
    return json?.error?.message ?? JSON.stringify(json);
  } catch {
    return await response.text();
  }
}

// ── OpenAI-compatible ─────────────────────────────────────────
async function streamOpenAI(
  provider: AIProvider,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  customBaseUrl: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const baseUrl = provider.id === 'custom' ? customBaseUrl.replace(/\/$/, '') : provider.baseUrl;

  const body = {
    model,
    messages: [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      ...messages,
    ],
    stream: true,
  };

  let response: Response;
  try {
    response = await buildFetch(
      baseUrl,
      '/chat/completions',
      apiKey,
      { Authorization: `Bearer ${apiKey}` },
      body
    );
  } catch (err) {
    callbacks.onError(new Error(`Network error: ${(err as Error).message}`));
    return;
  }

  if (!response.ok) {
    callbacks.onError(new Error(`API error ${response.status}: ${await extractError(response)}`));
    return;
  }

  await readSSEStream(response, callbacks, false);
}

// ── Anthropic ─────────────────────────────────────────────────
async function streamAnthropic(
  provider: AIProvider,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: 8192,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  };
  if (systemPrompt) body.system = systemPrompt;

  let response: Response;
  try {
    response = await buildFetch(
      provider.baseUrl,
      '/messages',
      apiKey,
      {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Only needed for direct (non-proxy) browser access
        ...(!import.meta.env.DEV ? { 'anthropic-dangerous-direct-browser-access': 'true' } : {}),
      },
      body
    );
  } catch (err) {
    callbacks.onError(new Error(`Network error: ${(err as Error).message}`));
    return;
  }

  if (!response.ok) {
    callbacks.onError(new Error(`API error ${response.status}: ${await extractError(response)}`));
    return;
  }

  await readSSEStream(response, callbacks, true);
}

// ── Public API ────────────────────────────────────────────────
export async function streamCompletion(
  provider: AIProvider,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  customBaseUrl: string,
  callbacks: StreamCallbacks
): Promise<void> {
  if (provider.format === 'anthropic') {
    return streamAnthropic(provider, apiKey, model, messages, systemPrompt, callbacks);
  }
  return streamOpenAI(provider, apiKey, model, messages, systemPrompt, customBaseUrl, callbacks);
}

// ── Connection test ───────────────────────────────────────────
export async function testConnection(
  provider: AIProvider,
  apiKey: string,
  model: string,
  customBaseUrl: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; error?: string }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10_000);

  // If the caller provides an outer signal (e.g. component unmount), chain it.
  signal?.addEventListener('abort', () => ac.abort());

  return new Promise((resolve) => {
    streamCompletion(
      provider,
      apiKey,
      model,
      [{ role: 'user', content: 'Reply with just the word "OK".' }],
      '',
      customBaseUrl,
      {
        onChunk: () => {},
        onDone: () => { clearTimeout(timer); resolve({ ok: true }); },
        onError: (err) => {
          clearTimeout(timer);
          const msg = ac.signal.aborted
            ? 'Request timed out (10s)'
            : err.message;
          resolve({ ok: false, error: msg });
        },
      }
    );
  });
}
