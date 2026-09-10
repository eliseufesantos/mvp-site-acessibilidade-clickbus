import { createServer } from 'vite';

const server = await createServer({
  root: process.cwd(),
  configFile: false,
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
});

try {
  await server.ssrLoadModule('/src/features/accessibility-agent/tests/run.ts');
} finally {
  await server.close();
}
