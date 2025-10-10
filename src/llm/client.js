// Generic LLM client for OpenAI-style and Anthropic-style APIs
// Note: Network access may be restricted in your environment.

export class LLMClient {
  constructor({ provider, apiKey, model, extras } = {}) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model;
    this.extras = extras || {};
  }

  async call({ system, user, tools = null }) {
    if (!this.apiKey) throw new Error('LLM API key not provided');
    if (this.provider === 'openai') return await callOpenAI({ apiKey: this.apiKey, model: this.model, system, user, extras: this.extras });
    if (this.provider === 'anthropic') return await callAnthropic({ apiKey: this.apiKey, model: this.model, system, user, extras: this.extras });
    throw new Error(`Unsupported provider: ${this.provider}`);
  }
}

async function callOpenAI({ apiKey, model, system, user, extras }) {
  const body = {
    model: model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user }
    ],
    temperature: extras?.temperature ?? 0.2,
    max_tokens: extras?.maxTokens ?? 1500
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '';
  return text;
}

async function callAnthropic({ apiKey, model, system, user, extras }) {
  const body = {
    model: model,
    messages: [ { role: 'user', content: user } ],
    max_tokens: extras?.maxTokens ?? 1500,
    temperature: extras?.temperature ?? 0.2,
    system: system || undefined
  };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const text = Array.isArray(json.content) ? json.content.map(c => c.text || '').join('\n') : (json.content?.[0]?.text || '');
  return text;
}

