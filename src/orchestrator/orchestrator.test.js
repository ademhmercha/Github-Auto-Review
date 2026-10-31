import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../agents/explorerAgent.js', () => ({ explorerAgent: vi.fn() }));
vi.mock('../agents/reviewerAgent.js', () => ({ reviewerAgent: vi.fn() }));
vi.mock('../agents/docAgent.js', () => ({ docAgent: vi.fn() }));
vi.mock('../agents/reporterAgent.js', () => ({ reporterAgent: vi.fn() }));
vi.mock('../agents/refactorAgent.js', () => ({ refactorAgent: vi.fn() }));

import { explorerAgent } from '../agents/explorerAgent.js';
import { reviewerAgent } from '../agents/reviewerAgent.js';
import { docAgent } from '../agents/docAgent.js';
import { reporterAgent } from '../agents/reporterAgent.js';
import { refactorAgent } from '../agents/refactorAgent.js';
import { runOrchestrator } from './orchestrator.js';

const explorer = { owner: 'octo', repo: 'demo', keyFiles: [] };
const issues = [{ severity: 'info', file: 'a.js', description: 'x' }];
const doc = { generatedReadme: '# Demo', existingReadme: null };
const report = { score: 8, summary: 's', priorities: [] };
const refactors = [{ file: 'a.js', title: 't', before: 'b', after: 'a', reason: 'r' }];

/** Lance l'orchestrateur en avançant les `sleep` entre agents, et collecte les événements. */
async function run() {
  const events = [];
  const promise = runOrchestrator('https://github.com/octo/demo', 'gsk_key', (e) => events.push(e));
  await vi.runAllTimersAsync();
  return { result: await promise, events };
}

const statusOf = (events, agent) => events.filter((e) => e.agent === agent).map((e) => e.status);

beforeEach(() => {
  vi.useFakeTimers();
  [explorerAgent, reviewerAgent, docAgent, reporterAgent, refactorAgent].forEach((m) => m.mockReset());
  explorerAgent.mockResolvedValue(explorer);
  reviewerAgent.mockResolvedValue(issues);
  docAgent.mockResolvedValue(doc);
  reporterAgent.mockResolvedValue(report);
  refactorAgent.mockResolvedValue(refactors);
});

afterEach(() => vi.useRealTimers());

describe('runOrchestrator', () => {
  it('exécute les 5 agents dans l’ordre et renvoie tous les résultats', async () => {
    const { result, events } = await run();

    expect(result).toEqual({
      explorerResult: explorer,
      reviewerResult: issues,
      docResult: doc,
      reporterResult: report,
      refactorResult: refactors,
    });
    expect(events.map((e) => `${e.agent}:${e.status}`)).toEqual([
      'explorer:running', 'explorer:done',
      'reviewer:running', 'reviewer:done',
      'doc:running', 'doc:done',
      'reporter:running', 'reporter:done',
      'refactor:running', 'refactor:done',
    ]);
  });

  it('passe la clé API et les résultats précédents aux agents suivants', async () => {
    await run();

    expect(explorerAgent).toHaveBeenCalledWith('https://github.com/octo/demo');
    expect(reviewerAgent).toHaveBeenCalledWith(explorer, 'gsk_key');
    expect(docAgent).toHaveBeenCalledWith(explorer, 'gsk_key');
    expect(reporterAgent).toHaveBeenCalledWith(explorer, issues, doc, 'gsk_key');
    expect(refactorAgent).toHaveBeenCalledWith(explorer, issues, 'gsk_key');
  });

  it('attend entre les appels à l’API pour respecter les limites de débit', async () => {
    const promise = runOrchestrator('https://github.com/octo/demo', 'k', () => {});

    await vi.advanceTimersByTimeAsync(999);
    expect(reviewerAgent).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(reviewerAgent).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();
    await promise;
  });

  it('si l’Explorer échoue, arrête tout et marque les autres agents comme ignorés', async () => {
    explorerAgent.mockRejectedValue(new Error('Repository not found'));

    const { result, events } = await run();

    expect(result).toBeNull();
    expect(events).toContainEqual({ agent: 'explorer', status: 'error', error: 'Repository not found' });
    for (const agent of ['reviewer', 'doc', 'reporter', 'refactor']) {
      expect(events).toContainEqual({ agent, status: 'error', error: 'Skipped: Explorer failed' });
    }
    expect(reviewerAgent).not.toHaveBeenCalled();
    expect(refactorAgent).not.toHaveBeenCalled();
  });

  it('si le Reviewer échoue, continue avec une liste de problèmes vide', async () => {
    reviewerAgent.mockRejectedValue(new Error('Invalid API Key'));

    const { result, events } = await run();

    expect(statusOf(events, 'reviewer')).toEqual(['running', 'error']);
    expect(reporterAgent).toHaveBeenCalledWith(explorer, [], doc, 'gsk_key');
    expect(refactorAgent).toHaveBeenCalledWith(explorer, [], 'gsk_key');
    expect(result.reviewerResult).toEqual([]);
  });

  it('si le Doc Agent échoue, le Reporter reçoit « pas de README généré »', async () => {
    docAgent.mockRejectedValue(new Error('boom'));

    await run();

    expect(reporterAgent).toHaveBeenCalledWith(explorer, issues, { generatedReadme: null }, 'gsk_key');
  });

  it('si le Reporter échoue, le rapport est null mais le Refactor Agent tourne quand même', async () => {
    reporterAgent.mockRejectedValue(new Error('JSON invalide'));

    const { result, events } = await run();

    expect(result.reporterResult).toBeNull();
    expect(result.refactorResult).toEqual(refactors);
    expect(events).toContainEqual({ agent: 'reporter', status: 'error', error: 'JSON invalide' });
  });

  it('si le Refactor Agent échoue, renvoie une liste vide', async () => {
    refactorAgent.mockRejectedValue(new Error('429'));

    const { result } = await run();

    expect(result.refactorResult).toEqual([]);
    expect(result.reporterResult).toEqual(report);
  });
});
