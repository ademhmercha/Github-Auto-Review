import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/groq.js', () => ({ groq: vi.fn() }));

import { groq } from '../lib/groq.js';
import { reviewerAgent } from './reviewerAgent.js';

const explorerResult = {
  framework: 'React',
  language: 'JavaScript',
  keyFiles: [
    { name: 'src/App.jsx', content: 'export default function App() {}' },
    { name: 'package.json', content: '{"name":"demo"}' },
  ],
};

beforeEach(() => {
  groq.mockReset();
});

describe('reviewerAgent', () => {
  it('envoie la clé API, le contexte du projet et le contenu des fichiers au modèle', async () => {
    groq.mockResolvedValue('[]');

    await reviewerAgent(explorerResult, 'gsk_key');

    const [apiKey, systemPrompt, userMessage] = groq.mock.calls[0];
    expect(apiKey).toBe('gsk_key');
    expect(systemPrompt).toMatch(/code reviewer/i);
    expect(userMessage).toContain('React (JavaScript)');
    expect(userMessage).toContain('### src/App.jsx');
    expect(userMessage).toContain('export default function App() {}');
    expect(userMessage).toContain('### package.json');
  });

  it('renvoie les problèmes détectés', async () => {
    groq.mockResolvedValue(
      '[{"severity":"critical","file":"src/App.jsx","description":"Clé API en dur"}]'
    );

    expect(await reviewerAgent(explorerResult, 'k')).toEqual([
      { severity: 'critical', file: 'src/App.jsx', description: 'Clé API en dur' },
    ]);
  });

  it('accepte une réponse enveloppée dans des balises markdown', async () => {
    groq.mockResolvedValue('```json\n[{"severity":"info","file":"a.js","description":"ok"}]\n```');

    expect(await reviewerAgent(explorerResult, 'k')).toHaveLength(1);
  });

  it('normalise les sévérités et complète les champs manquants', async () => {
    groq.mockResolvedValue(
      JSON.stringify([
        { severity: 'High', file: 'a.js', description: 'x' },
        { severity: 'medium', file: 'b.js', description: 'y' },
        { description: 'sans sévérité ni fichier' },
      ])
    );

    const issues = await reviewerAgent(explorerResult, 'k');

    expect(issues.map((i) => i.severity)).toEqual(['critical', 'warning', 'info']);
    expect(issues[2]).toEqual({ severity: 'info', file: 'unknown', description: 'sans sévérité ni fichier' });
  });

  it('écarte les éléments qui ne sont pas des objets', async () => {
    groq.mockResolvedValue('[null, "texte", 3, {"severity":"info","file":"a.js","description":"ok"}]');

    expect(await reviewerAgent(explorerResult, 'k')).toHaveLength(1);
  });

  it('lève une erreur plutôt que de prétendre qu’il n’y a aucun problème quand la réponse est invalide', async () => {
    groq.mockResolvedValue('Je ne peux pas analyser ce code.');

    await expect(reviewerAgent(explorerResult, 'k')).rejects.toThrow(/valid JSON/);
  });

  it("propage l'erreur de l'API Groq", async () => {
    groq.mockRejectedValue(new Error('Invalid API Key'));

    await expect(reviewerAgent(explorerResult, 'k')).rejects.toThrow('Invalid API Key');
  });
});
