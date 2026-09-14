import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAccessibilityRequest, type AccessibilityEndpoint } from './server/accessibility/handler';

type MiddlewareServer = { middlewares: { use(handler: (request: any, response: any, next: () => void) => void): void } };

const attachAccessibilityApi = (server: MiddlewareServer) => {
  server.middlewares.use(async (request, response, next) => {
      const match = request.url?.match(/^\/api\/accessibility\/(plan|explain|simplify)(?:\?|$)/);
      if (!match) { next(); return; }
      const chunks: Uint8Array[] = [];
      for await (const chunk of request) chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
      const body = Buffer.concat(chunks);
      const webRequest = new Request(`http://127.0.0.1${request.url}`, {
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
