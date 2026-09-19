import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {
  handleAccessibilityRequest,
  MAX_ACCESSIBILITY_REQUEST_BYTES,
  type AccessibilityEndpoint,
} from './server/accessibility/handler';
import { handleRybenaRequest } from './server/accessibility/rybena';

type MiddlewareServer = { middlewares: { use(handler: (request: any, response: any, next: () => void) => void): void } };

const attachAccessibilityApi = (server: MiddlewareServer) => {
  server.middlewares.use(async (request, response, next) => {
      const rybenaMatch = request.url?.match(/^\/api\/accessibility\/rybena(?:\?|$)/);
      if (rybenaMatch) {
        const host = request.headers.host || '127.0.0.1:4173';
        const webRequest = new Request(`http://${host}${request.url}`, {
          method: request.method,
          headers: request.headers as HeadersInit,
        });
        const result = handleRybenaRequest(webRequest);
        response.statusCode = result.status;
        result.headers.forEach((value, key) => response.setHeader(key, value));
        response.end(Buffer.from(await result.arrayBuffer()));
        return;
      }

      const match = request.url?.match(/^\/api\/accessibility\/(plan|explain|simplify)(?:\?|$)/);
      if (!match) { next(); return; }
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of request) {
        const bytes = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk;
        size += bytes.byteLength;
        if (size > MAX_ACCESSIBILITY_REQUEST_BYTES) {
          response.statusCode = 413;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.setHeader('cache-control', 'no-store');
          response.end(JSON.stringify({ error: 'A solicitação excede o limite de 16 KiB.' }));
          return;
        }
        chunks.push(bytes);
      }
      const body = Buffer.concat(chunks);
      const host = request.headers.host || '127.0.0.1:4173';
      const webRequest = new Request(`http://${host}${request.url}`, {
        method: request.method,
        headers: request.headers as HeadersInit,
        body: body.length > 0 ? body : undefined,
      });
      const result = await handleAccessibilityRequest(webRequest, match[1] as AccessibilityEndpoint);
      response.statusCode = result.status;
      result.headers.forEach((value, key) => response.setHeader(key, value));
      response.end(Buffer.from(await result.arrayBuffer()));
  });
};

const accessibilityApi = () => ({
  name: 'accessibility-api',
  configureServer: attachAccessibilityApi,
  configurePreviewServer: attachAccessibilityApi,
});

export default defineConfig({
  plugins: [react(), accessibilityApi()],
  server: {
    host: '127.0.0.1',
    port: 4173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
});
