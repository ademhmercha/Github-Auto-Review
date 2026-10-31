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

export async function groq(apiKey, systemPrompt, userMessage) {
  const model = await resolveModel(apiKey);

  const res = await fetch(GROQ_URL, {
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
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Groq API error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
