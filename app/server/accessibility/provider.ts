export interface LlmProvider {
  complete(system: string, user: string, signal: AbortSignal): Promise<unknown>;
}

interface ProviderConfiguration {
  endpoint: string;
  model: string;
  apiKey: string;
}

const readConfiguration = (): ProviderConfiguration | null => {
  const environment = typeof process === 'undefined' ? {} : process.env;
  const endpoint = environment.ACCESSIBILITY_LLM_ENDPOINT?.trim();
  const model = environment.ACCESSIBILITY_LLM_MODEL?.trim();
  const apiKey = environment.ACCESSIBILITY_LLM_API_KEY?.trim();
  return endpoint && model && apiKey ? { endpoint, model, apiKey } : null;
};

class OpenAiCompatibleProvider implements LlmProvider {
  constructor(private readonly configuration: ProviderConfiguration) {}

  async complete(system: string, user: string, signal: AbortSignal): Promise<unknown> {
    const response = await fetch(`${this.configuration.endpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.configuration.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.configuration.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      }),
      signal,
    });
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    const body = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error('provider_empty_response');
    return JSON.parse(content) as unknown;
  }
}

export const getConfiguredProvider = (): LlmProvider | null => {
  const configuration = readConfiguration();
  return configuration ? new OpenAiCompatibleProvider(configuration) : null;
};
