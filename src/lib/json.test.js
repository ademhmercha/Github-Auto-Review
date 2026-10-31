import { describe, it, expect } from 'vitest';
import { parseModelJson, normalizeSeverity } from './json.js';

describe('parseModelJson', () => {
  it('parse un tableau JSON brut', () => {
    expect(parseModelJson('[{"a":1},{"a":2}]')).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('ignore les balises ```json et le texte autour', () => {
    const reply = 'Voici le résultat :\n```json\n[{"file":"a.js"}]\n```\nBonne journée !';
    expect(parseModelJson(reply, 'array')).toEqual([{ file: 'a.js' }]);
  });

  it('parse un objet quand on attend un objet', () => {
    expect(parseModelJson('Réponse : {"score": 8}', 'object')).toEqual({ score: 8 });
  });

  it("lève une erreur s'il n'y a aucun JSON", () => {
    expect(() => parseModelJson('désolé, je ne peux pas')).toThrow(/valid JSON/);
  });

  it('lève une erreur sur un JSON tronqué', () => {
    expect(() => parseModelJson('[{"file":"a.js","description":"coup')).toThrow(/valid JSON/);
  });

  it('lève une erreur si le JSON est mal formé entre les crochets', () => {
    expect(() => parseModelJson('[{file: a.js}]')).toThrow(/malformed/);
  });
});

describe('normalizeSeverity', () => {
  it.each([
    ['critical', 'critical'],
    ['WARNING', 'warning'],
    ['Info', 'info'],
  ])('garde les niveaux connus (%s)', (input, expected) => {
    expect(normalizeSeverity(input)).toBe(expected);
  });

  it.each([
    ['high', 'critical'],
    ['Error', 'critical'],
    ['medium', 'warning'],
    ['warn', 'warning'],
  ])('traduit les synonymes (%s -> %s)', (input, expected) => {
    expect(normalizeSeverity(input)).toBe(expected);
  });

  it.each([[undefined], [null], ['bizarre'], [42]])('retombe sur info pour %s', (input) => {
    expect(normalizeSeverity(input)).toBe('info');
  });
});
