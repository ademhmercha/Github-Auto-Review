// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputForm from './InputForm.jsx';

const VALID_KEY = 'gsk_abcdefghijklmnopqrstuvwxyz0123456789';

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('InputForm', () => {
  it('affiche le formulaire et les cinq agents', () => {
    render(<InputForm onAnalyze={vi.fn()} />);
    expect(screen.getByLabelText('Repository URL')).toBeTruthy();
    expect(screen.getByLabelText('Groq API key')).toBeTruthy();
    expect(screen.getByRole('button', { name: /analyze repository/i })).toBeTruthy();
    expect(screen.getAllByText('Explorer').length).toBeGreaterThan(0);
  });

  it('préremplit la clé enregistrée quand elle est valide', () => {
    localStorage.setItem('groq_api_key', VALID_KEY);
    render(<InputForm onAnalyze={vi.fn()} />);
    expect(screen.getByLabelText('Groq API key').value).toBe(VALID_KEY);
  });

  it('ignore et supprime une valeur stockée au mauvais format', () => {
    localStorage.setItem('groq_api_key', '<script>alert(1)</script>');
    render(<InputForm onAnalyze={vi.fn()} />);
    expect(screen.getByLabelText('Groq API key').value).toBe('');
    expect(localStorage.getItem('groq_api_key')).toBeNull();
  });

  it('masque la clé par défaut et permet de l’afficher puis de la cacher', async () => {
    const user = userEvent.setup();
    render(<InputForm onAnalyze={vi.fn()} />);
    const input = screen.getByLabelText('Groq API key');
    expect(input.type).toBe('password');

    await user.click(screen.getByRole('button', { name: 'show' }));
    expect(input.type).toBe('text');

    await user.click(screen.getByRole('button', { name: 'hide' }));
    expect(input.type).toBe('password');
  });

  it('enregistre la clé et lance l’analyse avec des valeurs nettoyées', async () => {
    const user = userEvent.setup();
    const onAnalyze = vi.fn();
    render(<InputForm onAnalyze={onAnalyze} />);

    await user.type(screen.getByLabelText('Repository URL'), 'https://github.com/octo/demo');
    await user.type(screen.getByLabelText('Groq API key'), VALID_KEY);
    await user.click(screen.getByRole('button', { name: /analyze repository/i }));

    expect(onAnalyze).toHaveBeenCalledWith('https://github.com/octo/demo', VALID_KEY);
    expect(localStorage.getItem('groq_api_key')).toBe(VALID_KEY);
  });

  it('n’analyse rien et ne stocke rien si la clé a un format invalide', () => {
    const onAnalyze = vi.fn();
    render(<InputForm onAnalyze={onAnalyze} />);

    fireEvent.change(screen.getByLabelText('Repository URL'), {
      target: { value: 'https://github.com/octo/demo' },
    });
    fireEvent.change(screen.getByLabelText('Groq API key'), { target: { value: 'pas-une-cle' } });
    // submit direct : on vérifie la garde du gestionnaire, pas la validation native
    fireEvent.submit(screen.getByRole('button', { name: /analyze repository/i }).closest('form'));

    expect(onAnalyze).not.toHaveBeenCalled();
    expect(localStorage.getItem('groq_api_key')).toBeNull();
  });

  it('n’analyse rien si l’URL est vide', () => {
    const onAnalyze = vi.fn();
    render(<InputForm onAnalyze={onAnalyze} />);

    fireEvent.change(screen.getByLabelText('Groq API key'), { target: { value: VALID_KEY } });
    fireEvent.submit(screen.getByRole('button', { name: /analyze repository/i }).closest('form'));

    expect(onAnalyze).not.toHaveBeenCalled();
  });
});
