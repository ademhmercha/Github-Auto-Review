import { useState, useEffect } from 'react';

const AGENTS = [
  { name: 'Explorer', desc: 'Maps structure & stack' },
  { name: 'Reviewer', desc: 'Finds bugs & smells' },
  { name: 'Docs', desc: 'Audits & writes README' },
  { name: 'Reporter', desc: 'Scores the codebase' },
  { name: 'Refactor', desc: 'Before / after fixes' },
];

function Icon({ d, className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
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
    <div className="app-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-xl animate-fade-up">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            5 AI agents · powered by Groq
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
            Audit any repo
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              in under a minute.
            </span>
          </h1>
          <p className="mt-4 text-base text-slate-400 max-w-md mx-auto leading-relaxed">
            Paste a public GitHub link. A team of agents reviews the code, scores quality and proposes refactors.
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="surface rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <label htmlFor="repo" className="block text-sm font-medium text-slate-300 mb-2">
              GitHub repository
            </label>
            <div className="relative">
              <Icon
                className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
              <input
                id="repo"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="field pl-11 font-mono text-[13px]"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="key" className="text-sm font-medium text-slate-300">
                Groq API key
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                Get a free key →
              </a>
            </div>
            <div className="relative">
              <Icon
                className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
              <input
                id="key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="field pl-11 pr-14 font-mono text-[13px]"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-slate-500 hover:text-slate-200 transition-colors"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary !mt-7">
            Analyze repository
            <Icon d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Icon className="w-3.5 h-3.5" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            Your key stays in this browser, never on our servers
          </p>
        </form>

        {/* Agent lineup */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {AGENTS.map((a, i) => (
            <div
              key={a.name}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 animate-fade-up"
              style={{ animationDelay: `${150 + i * 70}ms` }}
            >
              <p className="text-[10px] font-mono text-indigo-300/70">0{i + 1}</p>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">{a.name}</p>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
