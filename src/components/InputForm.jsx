import { useState, useEffect } from 'react';

export default function InputForm({ onAnalyze }) {
  const [apiKey, setApiKey] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GitHub AutoReview Agent</h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            Paste a public GitHub repo URL and a free Groq API key. Four AI agents will analyze the code and produce a full audit report.
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Groq API Key
                <span className="ml-2 text-xs font-normal text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
                  100% Free
                </span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Stored in localStorage, never sent to any server.{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  Get a free key on console.groq.com
                </a>{' '}
                — no credit card required.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150 text-sm"
            >
              Analyze Repository
            </button>
          </form>

          {/* Agent list preview */}
          <div className="mt-6 pt-5 border-t border-gray-800">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Agents that will run</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Explorer', desc: 'Maps repo structure' },
                { name: 'Reviewer', desc: 'Finds code issues' },
                { name: 'Doc Agent', desc: 'Checks documentation' },
                { name: 'Reporter', desc: 'Scores & summarizes' },
              ].map((a) => (
                <div key={a.name} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <div>
                    <span className="text-gray-300 font-medium">{a.name}</span>
                    <span className="text-gray-500 ml-1">— {a.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
