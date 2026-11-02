// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act, cleanup } from '@testing-library/react';
import Reveal, { useCountUp } from './Reveal.jsx';

let observers;

beforeEach(() => {
  observers = [];
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.disconnect = vi.fn();
      this.observe = vi.fn();
      observers.push(this);
    }
  };
});

afterEach(() => {
  vi.useRealTimers();
  delete globalThis.IntersectionObserver;
});

afterEach(cleanup);

describe('Reveal', () => {
  it('affiche ses enfants, masqués tant que l’élément n’est pas visible', () => {
    render(<Reveal>contenu</Reveal>);
    const el = screen.getByText('contenu');
    expect(el.className).toContain('reveal');
    expect(el.className).not.toContain('is-in');
  });

  it('applique le délai de transition et la classe personnalisée', () => {
    render(
      <Reveal delay={120} className="extra">
        contenu
      </Reveal>
    );
    const el = screen.getByText('contenu');
    expect(el.style.transitionDelay).toBe('120ms');
    expect(el.className).toContain('extra');
  });

  it('utilise la balise demandée via la prop as', () => {
    render(<Reveal as="section">contenu</Reveal>);
    expect(screen.getByText('contenu').tagName).toBe('SECTION');
  });

  it('révèle le contenu une fois visible puis arrête d’observer', () => {
    render(<Reveal>contenu</Reveal>);
    const [io] = observers;
    act(() => io.callback([{ isIntersecting: true }]));
    expect(screen.getByText('contenu').className).toContain('is-in');
    expect(io.disconnect).toHaveBeenCalled();
  });

  it('reste masqué si l’élément n’est pas encore visible', () => {
    render(<Reveal>contenu</Reveal>);
    act(() => observers[0].callback([{ isIntersecting: false }]));
    expect(screen.getByText('contenu').className).not.toContain('is-in');
  });

  it('arrête d’observer au démontage', () => {
    const { unmount } = render(<Reveal>contenu</Reveal>);
    unmount();
    expect(observers[0].disconnect).toHaveBeenCalled();
  });
});

describe('useCountUp', () => {
  it('part de 0 puis atteint la valeur cible', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountUp(8, 1000));
    expect(result.current).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current).toBe(8);
  });

  it('traite une cible non numérique comme 0', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountUp('abc', 500));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(0);
  });
});
