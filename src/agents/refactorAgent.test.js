import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/groq.js', () => ({ groq: vi.fn() }));

import { groq } from '../lib/groq.js';
import { refactorAgent } from './refactorAgent.js';

const explorerResult = {
  framework: 'Express',
  language: 'JavaScript',
  keyFiles: [{ name: 'index.js', content: 'var x = 1;' }],
};
const reviewerResult = [{ severity: 'warning', file: 'index.js', description: 'var au lieu de const' }];

const suggestion = (n) => ({
  file: 'index.js',
  title: `Refactor ${n}`,
  before: 'var x = 1;',
  after: 'const x = 1;',
  reason: 'Préférer const',
});

beforeEach(() => {
  groq.mockReset();
});

describe('refactorAgent', () => {
  it('transmet les problèmes connus et le code au modèle, avec une limite de tokens élevée', async () => {
    groq.mockResolvedValue('[]');

    await refactorAgent(explorerResult, reviewerResult, 'gsk_key');

    const [apiKey, , userMessage, options] = groq.mock.calls[0];
    expect(apiKey).toBe('gsk_key');
    expect(userMessage).toContain('- [WARNING] index.js: var au lieu de const');
    expect(userMessage).toContain('### index.js');
    expect(options).toEqual({ maxTokens: 3072 });
  });

  it('indique « No prior issues found. » quand il n’y a pas de problème connu', async () => {
    groq.mockResolvedValue('[]');

    await refactorAgent(explorerResult, [], 'k');

    expect(groq.mock.calls[0][2]).toContain('No prior issues found.');
  });

  it('renvoie les suggestions avant/après', async () => {
    groq.mockResolvedValue(JSON.stringify([suggestion(1)]));

    expect(await refactorAgent(explorerResult, reviewerResult, 'k')).toEqual([suggestion(1)]);
  });

  it('limite à 4 suggestions même si le modèle en renvoie plus', async () => {
    groq.mockResolvedValue(JSON.stringify([1, 2, 3, 4, 5, 6].map(suggestion)));

    const result = await refactorAgent(explorerResult, reviewerResult, 'k');

    expect(result.map((s) => s.title)).toEqual(['Refactor 1', 'Refactor 2', 'Refactor 3', 'Refactor 4']);
  });

  it('complète les champs manquants et convertit les valeurs en texte', async () => {
    groq.mockResolvedValue(JSON.stringify([{ before: 12 }, null]));

    expect(await refactorAgent(explorerResult, reviewerResult, 'k')).toEqual([
      { file: 'unknown', title: 'Suggestion', before: '12', after: '', reason: '' },
    ]);
  });

  it('lève une erreur si la réponse est invalide', async () => {
    groq.mockResolvedValue('[{"file":"index.js","title":"coupé');

    await expect(refactorAgent(explorerResult, reviewerResult, 'k')).rejects.toThrow(/valid JSON/);
  });
});
