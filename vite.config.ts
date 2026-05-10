import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'http'

/**
 * Custom proxy middleware plugin.
 * The client sends requests to /ai-proxy/<path>
 * with an "x-target-base" header containing the real API base URL.
 * Node.js forwards the request (no CORS restrictions) and streams back the response.
 */
function aiProxyPlugin(): Plugin {
  return {
    name: 'ai-proxy-middleware',
    configureServer(server) {
      server.middlewares.use(
        '/ai-proxy',
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const targetBase = req.headers['x-target-base'] as string | undefined
          if (!targetBase) { next(); return }

          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', async () => {
            const body = Buffer.concat(chunks)
            const suffix = req.url ?? ''
            const targetUrl = targetBase.replace(/\/$/, '') + suffix

            const headers: Record<string, string> = {}
            for (const [k, v] of Object.entries(req.headers)) {
              const key = k.toLowerCase()
              if (key === 'host' || key === 'x-target-base' || key === 'connection') continue
              if (typeof v === 'string') headers[k] = v
            }

            try {
              const upstream = await fetch(targetUrl, {
                method: req.method ?? 'POST',
                headers,
                body: body.length > 0 ? body : undefined,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore Node 18 fetch needs duplex for streaming
                duplex: 'half',
              })

              const SKIP_HEADERS = new Set(['transfer-encoding', 'connection', 'keep-alive'])
              const resHeaders: Record<string, string> = {}
              upstream.headers.forEach((value, key) => {
                if (!SKIP_HEADERS.has(key.toLowerCase())) resHeaders[key] = value
              })
              res.writeHead(upstream.status, resHeaders)

              if (!upstream.body) { res.end(); return }

              const reader = upstream.body.getReader()
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                res.write(value)
              }
              res.end()

            } catch (err) {
              if (!res.headersSent) res.writeHead(502)
              res.end(JSON.stringify({ error: (err as Error).message }))
            }
          })
        }
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), aiProxyPlugin()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-syntax-highlighter')) return 'vendor-syntax';
          if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('micromark') || id.includes('mdast') || id.includes('unist')) return 'vendor-markdown';
          if (id.includes('@tanstack')) return 'vendor-router';
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react';
        },
      },
    },
  },

})
