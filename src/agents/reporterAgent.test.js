import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/groq.js', () => ({ groq: vi.fn() }));

import { groq } from '../lib/groq.js';
import { reporterAgent } from './reporterAgent.js';

const explorerResult = { owner: 'octo', repo: 'demo', framework: 'React', language: 'TypeScript', fileCount: 42 };
const docOk = { generatedReadme: null, existingReadme: 'un vrai README' };
const issues = [
  { severity: 'critical', file: 'a.js', description: 'Injection SQL' },
  { severity: 'info', file: 'b.js', description: 'Nom peu clair' },
];

const reply = (obj) => groq.mockResolvedValue(JSON.stringify(obj));
const run = (reviewer = issues, doc = docOk) => reporterAgent(explorerResult, reviewer, doc, 'k');

beforeEach(() => {
  groq.mockReset();
});

describe('reporterAgent - rapport', () => {
  it('renvoie le score, le résumé et les priorités du modèle', async () => {
    reply({ score: 7, summary: 'Correct.', priorities: ['Corriger A', 'Corriger B', 'Corriger C'] });

    expect(await run()).toEqual({
      score: 7,
      summary: 'Correct.',
      priorities: ['Corriger A', 'Corriger B', 'Corriger C'],
    });
  });

  it('inclut dépôt, stack et problèmes (avec sévérité en majuscules) dans le prompt', async () => {
    reply({ score: 7, summary: 's', priorities: [] });

    await run();

    const userMessage = groq.mock.calls[0][2];
    expect(userMessage).toContain('octo/demo');
    expect(userMessage).toContain('TypeScript');
    expect(userMessage).toContain('**File count:** 42');
    expect(userMessage).toContain('- [CRITICAL] a.js: Injection SQL');
    expect(userMessage).toContain('- [INFO] b.js: Nom peu clair');
  });

  it('indique « No issues found. » quand le reviewer n’a rien trouvé', async () => {
    reply({ score: 9, summary: 's', priorities: [] });

    await run([]);

    expect(groq.mock.calls[0][2]).toContain('No issues found.');
  });

  it.each([
    [{ generatedReadme: '# Nouveau README' }, /new README was generated/],
    [{ generatedReadme: null, existingReadme: 'long README' }, /README is present/],
  ])('décrit l’état du README (%j)', async (doc, expected) => {
    reply({ score: 5, summary: 's', priorities: [] });

    await run(issues, doc);

    expect(groq.mock.calls[0][2]).toMatch(expected);
  });
});

describe('reporterAgent - calcul du score', () => {
  it.each([
    [8, 8],
    ['8', 8],
    [7.5, 7.5],
    [0, 1],
    [15, 10],
    [-3, 1],
  ])('score %j -> %j (borné entre 1 et 10)', async (raw, expected) => {
    reply({ score: raw, summary: 's', priorities: [] });

    expect((await run()).score).toBe(expected);
  });

  it.each([['excellent'], [null], [undefined]])('score non numérique (%j) -> 5 par défaut', async (raw) => {
    reply({ score: raw, summary: 's', priorities: [] });

    expect((await run()).score).toBe(5);
  });
});

describe('reporterAgent - robustesse', () => {
  it('met des valeurs par défaut quand summary/priorities sont absents ou mal typés', async () => {
    reply({ score: 6, priorities: 'pas un tableau' });

    expect(await run()).toEqual({ score: 6, summary: '', priorities: [] });
  });

  it('convertit les priorités en texte', async () => {
    reply({ score: 6, summary: 's', priorities: [1, 'deux'] });

    expect((await run()).priorities).toEqual(['1', 'deux']);
  });

  it('lit un JSON entouré de texte', async () => {
    groq.mockResolvedValue('Voici le rapport :\n```json\n{"score": 4, "summary": "Faible", "priorities": []}\n```');

    expect((await run()).score).toBe(4);
  });

  it('lève une erreur si la réponse n’est pas du JSON', async () => {
    groq.mockResolvedValue('Pas de JSON ici');

    await expect(run()).rejects.toThrow(/valid JSON/);
  });
});
