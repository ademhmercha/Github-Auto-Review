import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { explorerAgent } from './explorerAgent.js';

const API = 'https://api.github.com/repos/octo/demo';

const b64 = (text) => Buffer.from(text, 'utf-8').toString('base64');
const blob = (path) => ({ type: 'blob', path });

/**
 * Simule l'API GitHub : `tree` décrit le dépôt, `files` donne le contenu de chaque fichier.
 * Un fichier absent de `files` répond 404.
 */
function mockGithub({ tree = [], files = {}, treeStatus = 200 } = {}) {
  const fetchMock = vi.fn(async (url) => {
    if (url.includes('/git/trees/')) {
      return { ok: treeStatus === 200, status: treeStatus, json: async () => ({ tree }) };
    }
    const path = url.replace(`${API}/contents/`, '');
    if (path in files) {
      const raw = files[path];
      const content = Buffer.isBuffer(raw) ? raw.toString('base64') : b64(raw);
      return { ok: true, status: 200, json: async () => ({ encoding: 'base64', content }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('explorerAgent - URL et erreurs GitHub', () => {
  it('refuse une URL qui ne vient pas de GitHub', async () => {
    mockGithub();
    await expect(explorerAgent('https://gitlab.com/octo/demo')).rejects.toThrow('Invalid GitHub URL');
  });

  it.each([
    ['https://github.com/octo/demo'],
    ['https://github.com/octo/demo.git'],
    ['https://github.com/octo/demo?tab=readme-ov-file'],
    ['https://github.com/octo/demo/tree/main/src'],
  ])('extrait owner et repo de %s', async (url) => {
    mockGithub({ tree: [blob('index.js')] });

    const result = await explorerAgent(url);

    expect(result).toMatchObject({ owner: 'octo', repo: 'demo' });
  });

  it('signale un dépôt introuvable (404)', async () => {
    mockGithub({ treeStatus: 404 });
    await expect(explorerAgent('https://github.com/octo/demo')).rejects.toThrow(/Repository not found/);
  });

  it.each([[403], [429]])('signale la limite de débit GitHub (%i)', async (status) => {
    mockGithub({ treeStatus: status });
    await expect(explorerAgent('https://github.com/octo/demo')).rejects.toThrow(/rate limit/i);
  });

  it('remonte les autres erreurs HTTP avec leur code', async () => {
    mockGithub({ treeStatus: 500 });
    await expect(explorerAgent('https://github.com/octo/demo')).rejects.toThrow('GitHub API error: 500');
  });
});

describe('explorerAgent - détection du dépôt', () => {
  const run = () => explorerAgent('https://github.com/octo/demo');

  it('ne compte que les fichiers (pas les dossiers)', async () => {
    mockGithub({ tree: [blob('a.js'), { type: 'tree', path: 'src' }, blob('src/b.js')] });
    expect((await run()).fileCount).toBe(2);
  });

  it.each([
    [{ dependencies: { next: '14', react: '18' } }, 'Next.js'],
    [{ dependencies: { react: '18' } }, 'React'],
    [{ devDependencies: { vue: '3' } }, 'Vue'],
    [{ dependencies: { express: '4' } }, 'Express'],
    [{ dependencies: { lodash: '4' } }, 'Unknown'],
  ])('détecte le framework depuis package.json (%j -> %s)', async (pkg, expected) => {
    mockGithub({ tree: [blob('package.json')], files: { 'package.json': JSON.stringify(pkg) } });
    expect((await run()).framework).toBe(expected);
  });

  it('retombe sur Unknown si package.json est invalide ou absent', async () => {
    mockGithub({ tree: [blob('package.json')], files: { 'package.json': '{ pas du json' } });
    expect((await run()).framework).toBe('Unknown');

    mockGithub({ tree: [blob('main.py')] });
    expect((await run()).framework).toBe('Unknown');
  });

  it.each([
    [['src/a.ts', 'src/b.js'], 'TypeScript'],
    [['app.py'], 'Python'],
    [['main.go'], 'Go'],
    [['lib.rs'], 'Rust'],
    [['index.js'], 'JavaScript'],
    [['notes.txt'], 'Unknown'],
  ])('détecte le langage depuis les extensions (%j -> %s)', async (paths, expected) => {
    mockGithub({ tree: paths.map(blob) });
    expect((await run()).language).toBe(expected);
  });
});

describe('explorerAgent - sélection et lecture des fichiers', () => {
  const run = () => explorerAgent('https://github.com/octo/demo');
  const names = (result) => result.keyFiles.map((f) => f.name);

  it('lit package.json et README.md en premier, puis complète avec les fichiers source les moins profonds', async () => {
    const paths = [
      'package.json',
      'README.md',
      'src/main.jsx',
      'src/App.jsx',
      'lib/util.js',
      'src/components/Deep.jsx',
      'node_modules/dep/index.js',
      'tests/app.test.js',
      'dist/bundle.min.js',
      'vite.config.js',
    ];
    const files = Object.fromEntries(paths.map((p) => [p, `// ${p}`]));
    const fetchMock = mockGithub({ tree: paths.map(blob), files });

    const result = await run();

    expect(names(result)).toEqual(['package.json', 'README.md', 'src/main.jsx', 'lib/util.js', 'src/App.jsx']);
    // 1 appel pour l'arbre + 5 fichiers : jamais plus de 5 lectures
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('prend des fichiers source quand il n’y a aucun fichier d’entrée connu (ex. Python)', async () => {
    mockGithub({
      tree: [blob('app/server.py'), blob('app/models.py'), blob('setup.py'), blob('docs/guide.md')],
      files: { 'app/server.py': 'a', 'app/models.py': 'b', 'setup.py': 'c' },
    });

    expect(names(await run())).toEqual(['setup.py', 'app/models.py', 'app/server.py']);
  });

  it('décode correctement le UTF-8 (accents, emoji)', async () => {
    mockGithub({ tree: [blob('README.md')], files: { 'README.md': 'Héllo ✓ 🚀' } });
    expect((await run()).keyFiles[0].content).toBe('Héllo ✓ 🚀');
  });

  it('tronque chaque fichier à 4000 caractères', async () => {
    mockGithub({ tree: [blob('index.js')], files: { 'index.js': 'x'.repeat(10_000) } });
    expect((await run()).keyFiles[0].content).toHaveLength(4000);
  });

  it('retire les caractères de contrôle mais garde retours à la ligne et tabulations', async () => {
    mockGithub({ tree: [blob('index.js')], files: { 'index.js': 'a\u0001b\tc\nd\u007F' } });
    expect((await run()).keyFiles[0].content).toBe('ab\tc\nd');
  });

  it('ignore les fichiers binaires et ceux qui ne se téléchargent pas', async () => {
    mockGithub({
      tree: [blob('package.json'), blob('README.md'), blob('index.js')],
      files: { 'package.json': Buffer.from([0x7b, 0x00, 0x7d]), 'index.js': 'ok' },
      // README.md absent de `files` : 404
    });

    expect(names(await run())).toEqual(['index.js']);
  });
});
