export interface LlmProvider {
  complete(system: string, user: string, signal: AbortSignal, responseSchema: unknown): Promise<unknown>;
}

// Modelos com raciocínio contam os tokens de pensamento dentro deste teto. Com
// 1.024 o orçamento se esgotava antes da resposta e `finishReason` voltava
// `MAX_TOKENS`, que o adaptador trata como resposta incompleta. A saída útil
// do contrato é pequena; a folga aqui é para o raciocínio, não para o texto.
const MAX_OUTPUT_TOKENS = 4096;

export interface ProviderConfiguration {
  endpoint: string;
  model: string;
  apiKey: string;
}

type Environment = Record<string, string | undefined>;
type FetchImplementation = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const GEMINI_API_HOST = 'generativelanguage.googleapis.com';
const GEMINI_MODEL_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

const normalizeModel = (model: string): string => {
  const normalized = model.replace(/^models\//, '').trim();
  if (!GEMINI_MODEL_PATTERN.test(normalized)) throw new Error('provider_configuration_invalid');
  return normalized;
};

export const buildGeminiGenerateContentUrl = (endpoint: string, model: string): string => {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('provider_configuration_invalid');
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname !== GEMINI_API_HOST ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) throw new Error('provider_configuration_invalid');

  const normalizedModel = normalizeModel(model);
  const fullEndpoint = /^\/(v1|v1beta)\/models\/([^/]+):generateContent$/.exec(url.pathname);
  if (fullEndpoint) {
    if (decodeURIComponent(fullEndpoint[2]) !== normalizedModel) throw new Error('provider_configuration_invalid');
    return url.toString();
  }

  const baseEndpoint = /^\/(v1|v1beta)\/?$/.exec(url.pathname);
  if (!baseEndpoint) throw new Error('provider_configuration_invalid');
  url.pathname = `/${baseEndpoint[1]}/models/${encodeURIComponent(normalizedModel)}:generateContent`;
  return url.toString();
};

const readConfiguration = (environment: Environment): ProviderConfiguration | null => {
  const endpoint = environment.ACCESSIBILITY_LLM_ENDPOINT?.trim();
  const model = environment.ACCESSIBILITY_LLM_MODEL?.trim();
  const apiKey = environment.ACCESSIBILITY_LLM_API_KEY?.trim();
  return endpoint && model && apiKey ? { endpoint, model, apiKey } : null;
};

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

class OpenAiCompatibleProvider implements LlmProvider {
  private readonly chatCompletionsUrl: string;

  constructor(
    private readonly configuration: ProviderConfiguration,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {
    let url: URL;
    try {
      url = new URL(configuration.endpoint);
    } catch {
      throw new Error('provider_configuration_invalid');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error('provider_configuration_invalid');
    }
    url.pathname = `${url.pathname.replace(/\/$/, '')}/chat/completions`;
    this.chatCompletionsUrl = url.toString();
  }

  async complete(system: string, user: string, signal: AbortSignal, responseSchema: unknown): Promise<unknown> {
    const response = await this.fetchImplementation(this.chatCompletionsUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.configuration.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.configuration.model,
        temperature: 0,
        max_tokens: MAX_OUTPUT_TOKENS,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'accessibility_response', strict: true, schema: responseSchema },
        },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      }),
      signal,
    });
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    const body = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error('provider_empty_response');
    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new Error('provider_invalid_json');
    }
  }
}

export class GeminiProvider implements LlmProvider {
  private readonly generateContentUrl: string;
  private readonly useLowThinking: boolean;

  constructor(
    private readonly configuration: ProviderConfiguration,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {
    this.generateContentUrl = buildGeminiGenerateContentUrl(configuration.endpoint, configuration.model);
    const model = normalizeModel(configuration.model);
    // `thinkingLevel` só é aceito pela família Gemini 3 ou superior; modelos
    // anteriores respondem com erro. Aliases mutáveis como `gemini-flash-latest`
    // ficam de fora porque podem resolver para um modelo anterior.
    this.useLowThinking = /^gemini-3(?:[.-]|$)/.test(model);
  }

  async complete(system: string, user: string, signal: AbortSignal, responseSchema: unknown): Promise<unknown> {
    const response = await this.fetchImplementation(this.generateContentUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': this.configuration.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseJsonSchema: responseSchema,
          responseMimeType: 'application/json',
          ...(this.useLowThinking ? { thinkingConfig: { thinkingLevel: 'LOW' } } : {}),
        },
        store: false,
      }),
      signal,
    });

    if (!response.ok) throw new Error(`provider_http_${response.status}`);

    let body: GeminiResponse;
    try {
      const parsed = await response.json() as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('provider_invalid_response');
      }
      body = parsed as GeminiResponse;
    } catch {
      throw new Error('provider_invalid_response');
    }

    if (body.promptFeedback?.blockReason) throw new Error('provider_blocked_response');
    const candidate = body.candidates?.[0];
    if (!candidate || candidate.finishReason !== 'STOP') throw new Error('provider_incomplete_response');
    const content = candidate.content?.parts
      ?.map((part) => !part.thought && typeof part.text === 'string' ? part.text : '')
      .join('')
      .trim();
    if (!content) throw new Error('provider_empty_response');

    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new Error('provider_invalid_json');
    }
  }
}

export const getConfiguredProvider = (
  environment: Environment = typeof process === 'undefined' ? {} : process.env,
  fetchImplementation: FetchImplementation = fetch,
): LlmProvider | null => {
  const configuration = readConfiguration(environment);
  if (!configuration) return null;
  try {
    const endpoint = new URL(configuration.endpoint);
    return endpoint.hostname === GEMINI_API_HOST
      ? new GeminiProvider(configuration, fetchImplementation)
      : new OpenAiCompatibleProvider(configuration, fetchImplementation);
  } catch {
    return null;
  }
};
