// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { runOrchestrator } from './orchestrator/orchestrator.js';

vi.mock('./orchestrator/orchestrator.js', () => ({ runOrchestrator: vi.fn() }));

// Clé factice assemblée à l'exécution : aucun littéral ressemblant à un secret dans le dépôt
const VALID_KEY = `gsk_${'a1B2'.repeat(10)}`;

async function submitForm(user) {
  await user.type(screen.getByLabelText('Repository URL'), 'https://github.com/octo/demo');
  await user.type(screen.getByLabelText('Groq API key'), VALID_KEY);
  await user.click(screen.getByRole('button', { name: /analyze repository/i }));
}

beforeEach(() => {
  localStorage.clear();
  runOrchestrator.mockReset();
  globalThis.IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
});

afterEach(() => {
  delete globalThis.IntersectionObserver;
});

afterEach(cleanup);

describe('App', () => {
  it('démarre sur l’écran de saisie', () => {
    render(<App />);
    expect(screen.getByLabelText('Repository URL')).toBeTruthy();
  });

  it('passe aux résultats et transmet l’URL et la clé à l’orchestrateur', async () => {
    runOrchestrator.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<App />);

    await submitForm(user);

    expect(runOrchestrator).toHaveBeenCalledWith(
      'https://github.com/octo/demo',
      VALID_KEY,
      expect.any(Function)
    );
    expect(screen.getByText('Pipeline')).toBeTruthy();
  });

  it('reflète la progression des agents à l’écran', async () => {
    runOrchestrator.mockImplementation(async (_url, _key, onProgress) => {
      onProgress({
        agent: 'explorer',
        status: 'done',
        result: { owner: 'octo', repo: 'demo', fileCount: 3, framework: 'React', language: 'JavaScript' },
      });
      onProgress({ agent: 'reviewer', status: 'error', error: 'Quota dépassé' });
    });
    const user = userEvent.setup();
    render(<App />);

    await submitForm(user);

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('octo/demo'));
    expect(screen.getByText('Quota dépassé')).toBeTruthy();
  });

  it('marque en erreur les agents non terminés si l’orchestrateur plante', async () => {
    runOrchestrator.mockImplementation(async (_url, _key, onProgress) => {
      onProgress({ agent: 'explorer', status: 'done', result: { owner: 'o', repo: 'r' } });
      throw new Error('Réseau coupé');
    });
    const user = userEvent.setup();
    render(<App />);

    await submitForm(user);

    await waitFor(() => expect(screen.getAllByText('Réseau coupé')).toHaveLength(4));
    expect(screen.getByText('5/5')).toBeTruthy();
  });

  it('revient à l’écran de saisie après « New analysis »', async () => {
    runOrchestrator.mockImplementation(async (_url, _key, onProgress) => {
      ['explorer', 'reviewer', 'doc', 'reporter', 'refactor'].forEach((agent) =>
        onProgress({ agent, status: 'error', error: 'stop' })
      );
    });
    const user = userEvent.setup();
    render(<App />);

    await submitForm(user);
    await user.click(await screen.findByRole('button', { name: /new analysis/i }));

    expect(screen.getByLabelText('Repository URL')).toBeTruthy();
  });
});
