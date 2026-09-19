type Environment = Record<string, string | undefined>;

const RYBENA_SCRIPT_ENDPOINT = 'https://cdn.rybena.com.br/dom/master/latest/rybena.js';
const RYBENA_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
export const RYBENA_AUTHORIZED_HOST = 'mvp-site-acessibilidade-clickbus-lovat.vercel.app';

const json = (body: unknown, status = 200, extraHeaders?: HeadersInit) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    'cross-origin-resource-policy': 'same-origin',
    'x-content-type-options': 'nosniff',
    ...Object.fromEntries(new Headers(extraHeaders)),
  },
});

export const buildRybenaScriptUrl = (token: string): string | null => {
  const normalizedToken = token.trim();
  if (!RYBENA_TOKEN_PATTERN.test(normalizedToken)) return null;

  const url = new URL(RYBENA_SCRIPT_ENDPOINT);
  url.searchParams.set('token', normalizedToken);
  url.searchParams.set('mode', 'api');
  url.searchParams.set('doNotTrack', 'true');
  return url.toString();
};

export const handleRybenaRequest = (
  request: Request,
  environment: Environment = typeof process === 'undefined' ? {} : process.env,
): Response => {
  if (request.method !== 'GET') {
    return json({ error: 'Método não permitido.' }, 405, { allow: 'GET' });
  }

  const scriptUrl = buildRybenaScriptUrl(environment.RYBENA_ACCESS_TOKEN ?? '');
  if (!scriptUrl) {
    return json({ error: 'A integração Rybená ainda não foi configurada.' }, 503);
  }
  const requestUrl = new URL(request.url);
  if (requestUrl.protocol !== 'https:' || requestUrl.hostname.toLowerCase() !== RYBENA_AUTHORIZED_HOST) {
    return json({ error: 'Este endereço não está autorizado para a integração Rybená.' }, 403);
  }

  return json({ scriptUrl });
};
