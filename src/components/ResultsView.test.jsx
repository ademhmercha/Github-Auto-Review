// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsView from './ResultsView.jsx';

const WAITING = {
  explorer: { status: 'waiting' },
  reviewer: { status: 'waiting' },
  doc: { status: 'waiting' },
  reporter: { status: 'waiting' },
  refactor: { status: 'waiting' },
};

const COMPLETE = {
  explorer: {
    status: 'done',
    result: { owner: 'octo', repo: 'demo', fileCount: 42, framework: 'React', language: 'JavaScript' },
  },
  reviewer: {
    status: 'done',
    result: [
      { severity: 'info', file: 'a.js', description: 'Petit détail' },
      { severity: 'critical', file: 'b.js', description: 'Faille grave' },
      { severity: 'warning', file: 'c.js', description: 'À surveiller' },
    ],
  },
  doc: { status: 'done', result: { generatedReadme: '# Généré', existingReadme: null } },
  reporter: {
    status: 'done',
    result: { score: 8.5, summary: 'Bon code', priorities: ['Corriger la faille', 'Ajouter des tests'] },
  },
  refactor: {
    status: 'done',
    result: [{ title: 'Utiliser await', file: 'load.js', before: 'a()\nb()', after: 'await a()', reason: 'Plus lisible' }],
  },
};

beforeEach(() => {
  globalThis.IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
});

afterEach(() => {
  delete globalThis.IntersectionObserver;
  vi.restoreAllMocks();
});

afterEach(cleanup);

describe('ResultsView — en cours d’analyse', () => {
  it('affiche les agents en attente et un titre provisoire', () => {
    render(<ResultsView agentStates={WAITING} onReset={vi.fn()} />);
    expect(screen.getAllByText('queued')).toHaveLength(5);
    expect(screen.getByText('0/5')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /new analysis/i })).toBeNull();
  });

  it('montre l’agent en cours avec sa description', () => {
    render(
      <ResultsView agentStates={{ ...WAITING, explorer: { status: 'running' } }} onReset={vi.fn()} />
    );
    expect(screen.getByText('Mapping repo structure…')).toBeTruthy();
  });

  it('montre une erreur d’agent, ou « failed » sans message', () => {
    render(
      <ResultsView
        agentStates={{
          ...WAITING,
          explorer: { status: 'error', error: 'Rate limit' },
          reviewer: { status: 'error' },
        }}
        onReset={vi.fn()}
      />
    );
    expect(screen.getByText('Rate limit')).toBeTruthy();
    expect(screen.getByText('failed')).toBeTruthy();
    expect(screen.getByText('2/5')).toBeTruthy();
  });

  it('tolère un état d’agent manquant', () => {
    render(<ResultsView agentStates={{}} onReset={vi.fn()} />);
    expect(screen.getAllByText('queued')).toHaveLength(5);
  });
});

describe('ResultsView — rapport complet', () => {
  it('affiche dépôt, métriques, verdict et priorités', () => {
    render(<ResultsView agentStates={COMPLETE} onReset={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('octo/demo');
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('React')).toBeTruthy();
    expect(screen.getByText('JavaScript')).toBeTruthy();
    expect(screen.getByText('Excellent')).toBeTruthy();
    expect(screen.getByText('Bon code')).toBeTruthy();
    expect(screen.getByText('Corriger la faille')).toBeTruthy();
    expect(screen.getByText('Ajouter des tests')).toBeTruthy();
  });

  it('classe les problèmes par gravité décroissante', () => {
    render(<ResultsView agentStates={COMPLETE} onReset={vi.fn()} />);
    const grave = screen.getByText('Faille grave');
    const warn = screen.getByText('À surveiller');
    const info = screen.getByText('Petit détail');
    expect(grave.compareDocumentPosition(warn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(warn.compareDocumentPosition(info) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('3 items')).toBeTruthy();
    expect(screen.getByText('1 critical')).toBeTruthy();
  });

  it('affiche les refactorisations avant/après avec leur justification', () => {
    render(<ResultsView agentStates={COMPLETE} onReset={vi.fn()} />);
    expect(screen.getByText('Utiliser await')).toBeTruthy();
    expect(screen.getByText('load.js')).toBeTruthy();
    expect(screen.getByText('await a()')).toBeTruthy();
    expect(screen.getByText('Plus lisible')).toBeTruthy();
  });

  it('affiche le README généré', () => {
    render(<ResultsView agentStates={COMPLETE} onReset={vi.fn()} />);
    expect(screen.getByText('README.md — auto-generated')).toBeTruthy();
    expect(screen.getByText('# Généré')).toBeTruthy();
  });

  it('affiche le README existant quand rien n’a été généré', () => {
    const states = {
      ...COMPLETE,
      doc: { status: 'done', result: { generatedReadme: null, existingReadme: '# Existant' } },
    };
    render(<ResultsView agentStates={states} onReset={vi.fn()} />);
    expect(screen.getByText('# Existant')).toBeTruthy();
    expect(screen.getByText('README.md')).toBeTruthy();
  });

  it('indique qu’aucun problème n’a été trouvé', () => {
    const states = { ...COMPLETE, reviewer: { status: 'done', result: [] } };
    render(<ResultsView agentStates={states} onReset={vi.fn()} />);
    expect(screen.getByText(/no issues found/i)).toBeTruthy();
  });
});

describe('ResultsView — verdict selon le score', () => {
  const withScore = (score) => ({
    ...COMPLETE,
    reporter: { status: 'done', result: { score, summary: 's', priorities: [] } },
  });

  it.each([
    [9, 'Excellent'],
    [6, 'Fair'],
    [2, 'At risk'],
  ])('score %s → %s', (score, word) => {
    render(<ResultsView agentStates={withScore(score)} onReset={vi.fn()} />);
    expect(screen.getByText(word)).toBeTruthy();
  });

  it('n’affiche pas la liste des priorités quand elle est vide', () => {
    render(<ResultsView agentStates={withScore(7)} onReset={vi.fn()} />);
    expect(screen.queryByText('Top priorities')).toBeNull();
  });
});

describe('ResultsView — actions', () => {
  it('lance l’export PDF via l’impression du navigateur', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<ResultsView agentStates={COMPLETE} onReset={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /export pdf/i }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it('relance une nouvelle analyse depuis chaque bouton', async () => {
    const onReset = vi.fn();
    render(<ResultsView agentStates={COMPLETE} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: /new analysis/i }));
    await userEvent.click(screen.getByRole('button', { name: /analyze another repo/i }));
    expect(onReset).toHaveBeenCalledTimes(2);
  });

  it('copie le README et confirme la copie', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ResultsView agentStates={COMPLETE} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'copy' }));

    expect(writeText).toHaveBeenCalledWith('# Généré');
    await waitFor(() => expect(screen.getByText('✓ copied')).toBeTruthy());
  });

  it('ne plante pas quand le presse-papiers est indisponible', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ResultsView agentStates={COMPLETE} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'copy' }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(within(document.body).getByRole('button', { name: 'copy' })).toBeTruthy();
  });
});
