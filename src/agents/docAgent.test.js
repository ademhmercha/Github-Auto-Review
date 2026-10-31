import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/groq.js', () => ({ groq: vi.fn() }));

import { groq } from '../lib/groq.js';
import { docAgent } from './docAgent.js';

const base = { framework: 'React', language: 'JavaScript', fileCount: 12, owner: 'octo', repo: 'demo' };
const withFiles = (keyFiles) => ({ ...base, keyFiles });

beforeEach(() => {
  groq.mockReset();
});

describe('docAgent', () => {
  it('garde le README existant s’il fait au moins 100 caractères, sans appeler le modèle', async () => {
    const readme = '# Demo\n' + 'x'.repeat(100);

    const result = await docAgent(withFiles([{ name: 'README.md', content: readme }]), 'k');

    expect(result).toEqual({ generatedReadme: null, existingReadme: readme });
    expect(groq).not.toHaveBeenCalled();
  });

  it('reconnaît le README quelle que soit la casse du nom de fichier', async () => {
    const result = await docAgent(withFiles([{ name: 'Readme.MD', content: 'y'.repeat(150) }]), 'k');

    expect(result.existingReadme).toHaveLength(150);
    expect(groq).not.toHaveBeenCalled();
  });

  it('génère un README quand il est trop court, en excluant l’ancien README du contexte', async () => {
    groq.mockResolvedValue('# Demo\nREADME généré');

    const result = await docAgent(
      withFiles([
        { name: 'README.md', content: '# Demo' },
        { name: 'index.js', content: 'console.log("hi")' },
      ]),
      'gsk_key'
    );

    expect(result).toEqual({ generatedReadme: '# Demo\nREADME généré', existingReadme: null });
    const [apiKey, , userMessage, options] = groq.mock.calls[0];
    expect(apiKey).toBe('gsk_key');
    expect(userMessage).toContain('octo/demo');
    expect(userMessage).toContain('### index.js');
    expect(userMessage).not.toContain('### README.md');
    expect(options).toEqual({ maxTokens: 3072 });
  });

  it('génère un README même sans aucun fichier lisible', async () => {
    groq.mockResolvedValue('# Demo');

    const result = await docAgent(withFiles([]), 'k');

    expect(result.generatedReadme).toBe('# Demo');
    expect(groq.mock.calls[0][2]).toContain('No source files available.');
  });

  it("propage l'erreur de l'API Groq", async () => {
    groq.mockRejectedValue(new Error('Rate limit reached'));

    await expect(docAgent(withFiles([]), 'k')).rejects.toThrow('Rate limit reached');
  });
});
