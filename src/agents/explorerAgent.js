const KEY_FILES = [
  'package.json',
  'README.md',
  'index.js',
  'index.ts',
  'app.js',
  'app.ts',
  'main.js',
  'main.ts',
  'index.jsx',
  'index.tsx',
  'app.jsx',
  'app.tsx',
  'main.jsx',
  'main.tsx',
  'src/index.js',
  'src/index.ts',
  'src/app.js',
  'src/app.ts',
  'src/main.js',
  'src/main.ts',
  'src/index.jsx',
  'src/index.tsx',
  'src/app.jsx',
  'src/app.tsx',
  'src/main.jsx',
  'src/main.tsx',
];

function detectFramework(files, packageJson) {
  if (!packageJson) return 'Unknown';
  try {
    const pkg = JSON.parse(packageJson);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['next']) return 'Next.js';
    if (deps['react']) return 'React';
    if (deps['vue']) return 'Vue';
    if (deps['@angular/core']) return 'Angular';
    if (deps['svelte']) return 'Svelte';
    if (deps['express']) return 'Express';
    if (deps['fastify']) return 'Fastify';
    if (deps['django']) return 'Django';
    if (deps['flask']) return 'Flask';
  } catch {
    // ignore
  }
  return 'Unknown';
}

function detectLanguage(fileNames) {
  const exts = fileNames.map((f) => f.split('.').pop());
  if (exts.includes('ts') || exts.includes('tsx')) return 'TypeScript';
  if (exts.includes('py')) return 'Python';
  if (exts.includes('go')) return 'Go';
  if (exts.includes('rs')) return 'Rust';
  if (exts.includes('java')) return 'Java';
  if (exts.includes('rb')) return 'Ruby';
  if (exts.includes('js') || exts.includes('jsx')) return 'JavaScript';
  return 'Unknown';
}

function sanitize(text) {
  // Remove null bytes and non-printable control chars (keep newlines/tabs)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

async function fetchFileContent(owner, repo, path) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.encoding === 'base64' && data.content) {
    try {
      const decoded = atob(data.content.replace(/\n/g, ''));
      // Skip binary files
      if (decoded.includes('\x00')) return null;
      return sanitize(decoded);
    } catch {
      return null;
    }
  }
  return null;
}

export async function explorerAgent(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  const [, owner, repo] = match;
  const cleanRepo = repo.replace(/\.git$/, '');

  // Fetch repo tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/HEAD?recursive=1`
  );
  if (!treeRes.ok) {
    const msg = treeRes.status === 404 ? 'Repository not found' : `GitHub API error: ${treeRes.status}`;
    throw new Error(msg);
  }
  const treeData = await treeRes.json();
  const allFiles = (treeData.tree || [])
    .filter((f) => f.type === 'blob')
    .map((f) => f.path);

  const fileCount = allFiles.length;

  // Determine which key files to fetch
  const filesToFetch = KEY_FILES.filter((kf) => allFiles.includes(kf)).slice(0, 5);

  // Always include package.json and README.md if present
  const priority = ['package.json', 'README.md'];
  const extras = filesToFetch.filter((f) => !priority.includes(f));
  const ordered = [
    ...priority.filter((f) => allFiles.includes(f)),
    ...extras,
  ].slice(0, 5);

  const keyFiles = [];
  for (const path of ordered) {
    const content = await fetchFileContent(owner, cleanRepo, path);
    if (content !== null) {
      keyFiles.push({ name: path, content: content.slice(0, 4000) });
    }
  }

  const packageJson = keyFiles.find((f) => f.name === 'package.json')?.content || null;
  const framework = detectFramework(allFiles, packageJson);
  const language = detectLanguage(allFiles);

  return { framework, language, fileCount, keyFiles, owner, repo: cleanRepo };
}
