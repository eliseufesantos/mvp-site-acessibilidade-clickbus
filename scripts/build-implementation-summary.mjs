/**
 * Gera o PDF do resumo da implementação a partir do HTML A4.
 *
 *   node scripts/build-implementation-summary.mjs
 *
 * Fonte:  docs/implementation/resumo-implementacao-a4.html
 * Saída:  output/pdf/Resumo_Implementacao_MVP_ClickBus_Acessivel.pdf
 *
 * Usa o Chrome ou o Edge já instalados no sistema em modo headless, sem
 * dependências de npm. As imagens são referenciadas por caminho relativo,
 * então o HTML precisa continuar na mesma pasta das capturas.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(ROOT, 'docs/implementation/resumo-implementacao-a4.html');
const OUTPUT = resolve(ROOT, 'output/pdf/Resumo_Implementacao_MVP_ClickBus_Acessivel.pdf');

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const browser = CANDIDATES.find((path) => existsSync(path));
if (!browser) {
  console.error('Nenhum Chrome ou Edge encontrado. Edite CANDIDATES em', import.meta.url);
  process.exit(1);
}
if (!existsSync(SOURCE)) {
  console.error('HTML de origem não encontrado:', SOURCE);
  process.exit(1);
}

mkdirSync(dirname(OUTPUT), { recursive: true });

execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  // dá tempo para as fontes do Google e as capturas carregarem antes de imprimir
  '--virtual-time-budget=20000',
  `--print-to-pdf=${OUTPUT}`,
  pathToFileURL(SOURCE).href,
], { stdio: 'inherit' });

console.log(OUTPUT);
