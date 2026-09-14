import { spawn } from 'node:child_process';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

let executable;
for (const candidate of candidates) {
  try { await access(candidate); executable = candidate; break; } catch { /* Try the next installed browser. */ }
}
if (!executable) throw new Error('Chrome ou Edge não encontrado.');

const root = process.cwd();
const profile = path.resolve(root, '.tmp-accessibility-cdp');
if (!profile.startsWith(root) || path.basename(profile) !== '.tmp-accessibility-cdp') throw new Error('Perfil temporário fora do projeto.');
const evidence = path.resolve(root, '..', 'docs', 'accessibility-agent', 'evidence');
await mkdir(profile, { recursive: true });
await mkdir(evidence, { recursive: true });

const port = 9237;
const browser = spawn(executable, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { stdio: 'ignore', windowsHide: true });

let socket;
try {
  let pages = [];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      if (pages.some((page) => page.type === 'page')) break;
    } catch { /* Browser is still starting. */ }
    await delay(100);
  }
  const page = pages.find((candidate) => candidate.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error('Aba de depuração não encontrada.');

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const commandId = ++id;
    pending.set(commandId, { resolve, reject });
    socket.send(JSON.stringify({ id: commandId, method, params }));
  });

  await command('Page.enable');
  await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 320,
    screenHeight: 844,
  });
  await command('Page.navigate', { url: 'http://127.0.0.1:4175/' });
  await delay(1200);

  const readMetrics = async () => {
    const result = await command('Runtime.evaluate', {
      expression: `JSON.stringify({
        innerWidth,
        innerHeight,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        trigger: (() => { const r = document.querySelector('.accessibility-trigger')?.getBoundingClientRect(); return r ? { left: r.left, right: r.right, width: r.width } : null; })(),
        panel: (() => { const r = document.querySelector('.accessibility-panel')?.getBoundingClientRect(); return r ? { left: r.left, right: r.right, width: r.width } : null; })()
      })`,
      returnByValue: true,
    });
    return JSON.parse(result.result.value);
  };

  const pageMetrics = await readMetrics();
  const pageCapture = await command('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(path.join(evidence, 'implementation-mobile-320.png'), Buffer.from(pageCapture.data, 'base64'));

  await command('Runtime.evaluate', { expression: `document.querySelector('.accessibility-trigger')?.click()` });
  await delay(250);
  const panelMetrics = await readMetrics();
  const panelCapture = await command('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(path.join(evidence, 'implementation-panel-mobile-320.png'), Buffer.from(panelCapture.data, 'base64'));

  await command('Runtime.evaluate', { expression: `document.querySelector('#a11y-tab-content')?.click()` });
  await delay(180);
  const contentCapture = await command('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(path.join(evidence, 'implementation-panel-content-mobile-320.png'), Buffer.from(contentCapture.data, 'base64'));

  console.log(JSON.stringify({ page: pageMetrics, panel: panelMetrics }, null, 2));
} finally {
  socket?.close();
  browser.kill();
  await delay(300);
  await rm(profile, { recursive: true, force: true }).catch(() => undefined);
}
