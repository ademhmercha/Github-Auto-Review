import { useState, useEffect } from 'react';

const AGENTS = [
  ['01', 'Explorer', 'maps the structure'],
  ['02', 'Reviewer', 'hunts bugs & smells'],
  ['03', 'Docs', 'audits the README'],
  ['04', 'Reporter', 'scores the codebase'],
  ['05', 'Refactor', 'rewrites the worst parts'],
];

const DIFF = [
  { n: 12, t: ' ', code: 'async function load(url) {', d: 900 },
  { n: 13, t: '-', code: '  var data = fetch(url).json()', d: 1500 },
  { n: 13, t: '+', code: '  const res = await fetch(url)', d: 2200 },
  { n: 14, t: '+', code: '  const data = await res.json()', d: 2700 },
  { n: 15, t: ' ', code: '  return data', d: 3200 },
];

function Word({ children, d }) {
  return (
    <span className="mask">
      <span style={{ '--d': `${d}ms` }}>{children}</span>
    </span>
  );
}

function DiffDemo() {
  return (
    <div className="slab relative overflow-hidden rise-in" style={{ '--d': '700ms' }}>
      <div className="flex items-center justify-between border-b-[1.5px] border-ink px-4 py-2">
        <span className="font-mono text-[11px] font-medium">src/api/load.js</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ember">
          <span className="h-1.5 w-1.5 rounded-full bg-ember pulse-ember" /> reviewing
        </span>
      </div>
      <div className="relative py-2 font-mono text-[12.5px] leading-7">
        <span className="scanbar" />
        {DIFF.map((l, i) => (
          <div
            key={i}
            className={`diff-line flex px-4 ${
              l.t === '-' ? 'bg-blood/10 text-blood' : l.t === '+' ? 'bg-moss/10 text-moss' : 'text-ink/60'
            }`}
            style={{ '--d': `${l.d}ms` }}
          >
            <span className="w-8 select-none text-ink/30">{l.n}</span>
            <span className="w-5 select-none font-bold">{l.t}</span>
            <span className="whitespace-pre">{l.code}</span>
          </div>
        ))}
        <div className="px-4 pt-1 text-ink/40">
          <span className="inline-block w-8" />
          <span className="caret" />
        </div>
      </div>
    </div>
  );
}

export default function InputForm({ onAnalyze }) {
  const [apiKey, setApiKey] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('groq_api_key');
    if (saved) setApiKey(saved);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!apiKey.trim() || !repoUrl.trim()) return;
    localStorage.setItem('groq_api_key', apiKey.trim());
    onAnalyze(repoUrl.trim(), apiKey.trim());
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="rise-in flex items-center justify-between px-6 py-5 md:px-12" style={{ '--d': '100ms' }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center bg-ink font-mono text-sm font-bold text-ember">
            ±
          </span>
          <span className="text-sm font-semibold tracking-tight">AutoReview</span>
        </div>
        <span className="hidden font-mono text-[11px] uppercase tracking-widest text-ink/40 sm:block">
          5 agents · Groq · free
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 pb-16 pt-6 md:px-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        {/* Left: hero */}
        <section>
          <h1 className="font-display text-[3.4rem] leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.6rem]">
            <Word d={150}>Your</Word> <Word d={230}>code,</Word>
            <br />
            <Word d={330}>
              <em className="mark">reviewed</em>
            </Word>{' '}
            <Word d={430}>by</Word>
            <br />
            <Word d={530}>a</Word> <Word d={610}>team</Word> <Word d={690}>of</Word> <Word d={770}>agents.</Word>
          </h1>

          <p className="rise-in mt-8 max-w-md text-lg leading-relaxed text-ink/65" style={{ '--d': '1000ms' }}>
            Paste any public GitHub repo. Five agents read it, score it, and rewrite the worst parts, in about a
            minute.
          </p>

          <div className="mt-10 max-w-md">
            <DiffDemo />
          </div>
        </section>

        {/* Right: form */}
        <section className="rise-in" style={{ '--d': '450ms' }}>
          <form onSubmit={handleSubmit} className="slab p-7 sm:p-9">
            <p className="eyebrow mb-7">Start an audit</p>

            <div className="mb-8">
              <label htmlFor="repo" className="mb-1 block text-sm font-semibold">
                Repository URL
              </label>
              <div className="field-wrap">
                <input
                  id="repo"
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="field"
                  required
                />
                <span className="field-line" />
              </div>
            </div>

            <div className="mb-9">
              <div className="mb-1 flex items-baseline justify-between">
                <label htmlFor="key" className="text-sm font-semibold">
                  Groq API key
                </label>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] uppercase tracking-wider text-ink/50 underline decoration-ember decoration-2 underline-offset-4 transition-colors hover:text-ember"
                >
                  Get free key ↗
                </a>
              </div>
              <div className="field-wrap">
                <input
                  id="key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="field pr-14"
                  required
                />
                <span className="field-line" />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-wider text-ink/40 transition-colors hover:text-ink"
                >
                  {showKey ? 'hide' : 'show'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-ink">
              <span>Analyze repository</span>
              <span className="arrow font-mono text-lg">→</span>
            </button>

            <p className="mt-5 font-mono text-[11px] leading-relaxed text-ink/45">
              ↳ Your key lives in this browser only. Nothing is stored on a server.
            </p>
          </form>
        </section>
      </main>

      {/* Agent ticker */}
      <div className="rise-in border-y-[1.5px] border-ink bg-ink py-3 text-paper" style={{ '--d': '1200ms' }}>
        <div className="marquee-track">
          {[...AGENTS, ...AGENTS, ...AGENTS, ...AGENTS].map(([n, name, desc], i) => (
            <span key={i} className="flex items-center gap-3 pr-10 font-mono text-xs uppercase tracking-widest">
              <span className="text-ember">{n}</span>
              <span className="font-bold">{name}</span>
              <span className="text-paper/50">{desc}</span>
              <span className="pl-7 text-paper/30">/</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
