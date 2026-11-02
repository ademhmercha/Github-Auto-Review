// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('./App.jsx', () => ({ default: () => <p>application montée</p> }));

describe('main', () => {
  it('monte l’application dans #root', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('./main.jsx');

    expect(await screen.findByText('application montée')).toBeTruthy();
    expect(document.getElementById('root').textContent).toContain('application montée');
  });
});
