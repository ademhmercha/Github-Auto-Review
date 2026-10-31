const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS_URL = 'https://api.groq.com/openai/v1/models';

// Best first. If none is available we fall back to any chat-capable model.
const PREFERRED_MODELS = [
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.1-8b-instant',
];
const NON_CHAT = /whisper|tts|guard|embed|prompt-guard|playai|orpheus/i;

const modelCache = new Map();

async function resolveModel(apiKey) {
  if (modelCache.has(apiKey)) return modelCache.get(apiKey);

  const res = await fetch(MODELS_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error ${res.status}`);
  }

  const ids = ((await res.json()).data || []).map((m) => m.id).filter((id) => !NON_CHAT.test(id));
  const model = PREFERRED_MODELS.find((id) => ids.includes(id)) || ids[0];
  if (!model) throw new Error('No chat model is available for this Groq API key.');

  modelCache.set(apiKey, model);
  return model;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_RETRIES = 3;

export async function groq(apiKey, systemPrompt, userMessage, { maxTokens = 2048 } = {}) {
  const model = await resolveModel(apiKey);

  let res;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    });

    // Free tier is rate limited: wait as long as Groq asks, then retry.
    if (res.status !== 429 || attempt >= MAX_RETRIES) break;
    const wait = Number(res.headers.get('retry-after'));
    await sleep((Number.isFinite(wait) && wait > 0 ? Math.min(wait, 30) : 5 * (attempt + 1)) * 1000);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Groq API error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
