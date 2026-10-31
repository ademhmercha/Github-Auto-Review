import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { groq } from './groq.js';

const MODELS_URL = 'https://api.groq.com/openai/v1/models';
const CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

function response(body, { status = 200, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
  };
}

const models = (...ids) => response({ data: ids.map((id) => ({ id })) });
const completion = (content) => response({ choices: [{ message: { content } }] });

// Le cache de modèle est global au module et indexé par clé : une clé unique par test.
let keyCounter = 0;
const nextKey = () => `gsk_test_${++keyCounter}`;

let fetchMock;
const chatCalls = () => fetchMock.mock.calls.filter(([url]) => url === CHAT_URL);

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('groq - choix du modèle', () => {
  it('préfère llama-3.3-70b-versatile et ignore les modèles non-chat', async () => {
    fetchMock.mockImplementation(async (url) =>
      url === MODELS_URL
        ? models('whisper-large-v3', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile')
        : completion('ok')
    );

    await groq(nextKey(), 'sys', 'user');

    const body = JSON.parse(chatCalls()[0][1].body);
    expect(body.model).toBe('llama-3.3-70b-versatile');
  });

  it("retombe sur un modèle de chat quelconque si aucun préféré n'existe", async () => {
    fetchMock.mockImplementation(async (url) =>
      url === MODELS_URL ? models('playai-tts', 'some/new-model', 'llama-guard-4') : completion('ok')
    );

    await groq(nextKey(), 'sys', 'user');

    expect(JSON.parse(chatCalls()[0][1].body).model).toBe('some/new-model');
  });

  it("lève une erreur claire si la clé n'a accès à aucun modèle de chat", async () => {
    fetchMock.mockResolvedValue(models('whisper-large-v3', 'playai-tts'));

    await expect(groq(nextKey(), 'sys', 'user')).rejects.toThrow(/No chat model/);
  });

  it('ne demande la liste des modèles qu’une fois par clé', async () => {
    const key = nextKey();
    fetchMock.mockImplementation(async (url) =>
      url === MODELS_URL ? models('llama-3.3-70b-versatile') : completion('ok')
    );

    await groq(key, 'sys', 'a');
    await groq(key, 'sys', 'b');

    expect(fetchMock.mock.calls.filter(([url]) => url === MODELS_URL)).toHaveLength(1);
    expect(chatCalls()).toHaveLength(2);
  });

  it("remonte le message d'erreur de Groq quand la clé est refusée", async () => {
    fetchMock.mockResolvedValue(response({ error: { message: 'Invalid API Key' } }, { status: 401 }));

    await expect(groq(nextKey(), 'sys', 'user')).rejects.toThrow('Invalid API Key');
  });
});

describe('groq - requête de complétion', () => {
  beforeEach(() => {
    fetchMock.mockImplementation(async (url) =>
      url === MODELS_URL ? models('llama-3.3-70b-versatile') : completion('réponse du modèle')
    );
  });

  it('envoie la clé, les messages et les paramètres, et renvoie le texte', async () => {
    const key = nextKey();

    const text = await groq(key, 'system prompt', 'user message', { maxTokens: 3072 });

    const [, init] = chatCalls()[0];
    expect(text).toBe('réponse du modèle');
    expect(init.headers.Authorization).toBe(`Bearer ${key}`);
    expect(JSON.parse(init.body)).toMatchObject({
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'user message' },
      ],
      max_tokens: 3072,
      temperature: 0.2,
    });
  });

  it('utilise 2048 tokens par défaut', async () => {
    await groq(nextKey(), 'sys', 'user');

    expect(JSON.parse(chatCalls()[0][1].body).max_tokens).toBe(2048);
  });

  it('renvoie une chaîne vide si la réponse ne contient aucun choix', async () => {
    fetchMock.mockImplementation(async (url) =>
      url === MODELS_URL ? models('llama-3.3-70b-versatile') : response({ choices: [] })
    );

    expect(await groq(nextKey(), 'sys', 'user')).toBe('');
  });

  it('lève une erreur avec le code HTTP si le corps de l’erreur est illisible', async () => {
    fetchMock.mockImplementation(async (url) =>
      url === MODELS_URL
        ? models('llama-3.3-70b-versatile')
        : { ok: false, status: 500, headers: { get: () => null }, json: async () => { throw new Error('html'); } }
    );

    await expect(groq(nextKey(), 'sys', 'user')).rejects.toThrow('Groq API error 500');
  });
});

describe('groq - limite de débit (429)', () => {
  it('attend le délai retry-after puis réessaie', async () => {
    vi.useFakeTimers();
    let chatAttempts = 0;
    fetchMock.mockImplementation(async (url) => {
      if (url === MODELS_URL) return models('llama-3.3-70b-versatile');
      chatAttempts++;
      return chatAttempts === 1
        ? response({ error: { message: 'rate limited' } }, { status: 429, headers: { 'retry-after': '2' } })
        : completion('enfin');
    });

    const promise = groq(nextKey(), 'sys', 'user');
    await vi.advanceTimersByTimeAsync(1999);
    expect(chatCalls()).toHaveLength(1); // toujours en attente

    await vi.advanceTimersByTimeAsync(1);
    expect(await promise).toBe('enfin');
    expect(chatCalls()).toHaveLength(2);
  });

  it('abandonne après 3 nouvelles tentatives et remonte le message de Groq', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async (url) =>
      url === MODELS_URL
        ? models('llama-3.3-70b-versatile')
        : response({ error: { message: 'Rate limit reached' } }, { status: 429, headers: { 'retry-after': '1' } })
    );

    const assertion = expect(groq(nextKey(), 'sys', 'user')).rejects.toThrow('Rate limit reached');
    await vi.runAllTimersAsync();
    await assertion;

    expect(chatCalls()).toHaveLength(4); // 1 essai + 3 relances
  });

  it("plafonne l'attente à 30 secondes", async () => {
    vi.useFakeTimers();
    let chatAttempts = 0;
    fetchMock.mockImplementation(async (url) => {
      if (url === MODELS_URL) return models('llama-3.3-70b-versatile');
      return ++chatAttempts === 1
        ? response({}, { status: 429, headers: { 'retry-after': '600' } })
        : completion('ok');
    });

    const promise = groq(nextKey(), 'sys', 'user');
    await vi.advanceTimersByTimeAsync(30_000);

    expect(await promise).toBe('ok');
  });
});
