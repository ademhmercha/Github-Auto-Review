import { useState } from 'react';

const AGENT_LABELS = {
  explorer: { label: 'Explorer', desc: 'Mapping repo structure' },
  reviewer: { label: 'Code Reviewer', desc: 'Analyzing code quality' },
  doc: { label: 'Docs', desc: 'Checking documentation' },
  reporter: { label: 'Reporter', desc: 'Generating audit report' },
  refactor: { label: 'Refactor', desc: 'Suggesting improvements' },
};

const AGENT_ORDER = ['explorer', 'reviewer', 'doc', 'reporter', 'refactor'];

const SEVERITY_STYLES = {
  critical: {
    dot: 'bg-red-400',
    badge: 'bg-red-500/10 text-red-300 ring-red-400/25',
    bar: 'bg-red-500',
    glow: 'hover:border-red-400/30',
  },
  warning: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/10 text-amber-300 ring-amber-400/25',
    bar: 'bg-amber-500',
    glow: 'hover:border-amber-400/30',
  },
  info: {
    dot: 'bg-sky-400',
    badge: 'bg-sky-500/10 text-sky-300 ring-sky-400/25',
    bar: 'bg-sky-500',
    glow: 'hover:border-sky-400/30',
  },
};

function Icon({ d, className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const ICONS = {
  download: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
  refresh: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
  copy: 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75',
  check: 'M4.5 12.75l6 6 9-13.5',
  x: 'M6 18L18 6M6 6l12 12',
  file: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  files: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z',
  stack: 'M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3',
  code: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
};

function SectionHeading({ title, count, children }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-slate-400">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function StepNode({ status, index }) {
  const base = 'relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-500';
  if (status === 'done')
    return (
      <span className={`${base} bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40`}>
        <Icon d={ICONS.check} className="w-4 h-4" />
      </span>
    );
  if (status === 'error')
    return (
      <span className={`${base} bg-red-500/15 text-red-300 ring-1 ring-red-400/40`}>
        <Icon d={ICONS.x} className="w-4 h-4" />
      </span>
    );
  if (status === 'running')
    return (
      <span className={`${base} bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/60 animate-pulse-ring`}>
        <span className="h-4 w-4 rounded-full border-2 border-indigo-300 border-t-transparent animate-spin" />
      </span>
    );
  return <span className={`${base} bg-white/[0.03] text-slate-600 ring-1 ring-white/10`}>{index + 1}</span>;
}

function Pipeline({ agentStates }) {
  const finished = AGENT_ORDER.filter((k) => ['done', 'error'].includes(agentStates[k]?.status)).length;
  const pct = (finished / AGENT_ORDER.length) * 100;

  return (
    <div className="no-print surface rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="eyebrow">Agent pipeline</p>
        <p className="text-xs font-mono text-slate-500">
          {finished}/{AGENT_ORDER.length} complete
        </p>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06] mb-6">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2">
        {AGENT_ORDER.map((key, i) => {
          const state = agentStates[key] || { status: 'waiting' };
          const meta = AGENT_LABELS[key];
          return (
            <li key={key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2.5 min-w-0">
              <StepNode status={state.status} index={i} />
              <div className="min-w-0">
                <p className={`text-sm font-medium ${state.status === 'waiting' ? 'text-slate-500' : 'text-slate-100'}`}>
                  {meta.label}
                </p>
                <p
                  className={`text-xs truncate ${
                    state.status === 'running'
                      ? 'text-indigo-300'
                      : state.status === 'done'
                      ? 'text-emerald-400/80'
                      : state.status === 'error'
                      ? 'text-red-400'
                      : 'text-slate-600'
                  }`}
                  title={state.error}
                >
                  {state.status === 'running' && `${meta.desc}…`}
                  {state.status === 'done' && 'Completed'}
                  {state.status === 'error' && (state.error || 'Failed')}
                  {state.status === 'waiting' && 'Queued'}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="surface print-card rounded-2xl p-4 sm:p-5 min-w-0">
      <div className="flex items-center gap-2 text-slate-500 mb-3">
        <Icon d={icon} className="w-4 h-4" />
        <span className="eyebrow">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white truncate" title={String(value)}>
        {value || '—'}
      </p>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(10, Number(score) || 0));
  const tone = clamped >= 8 ? '#34d399' : clamped >= 5 ? '#fbbf24' : '#f87171';
  return (
    <div className="relative h-36 w-36 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 10)}
          style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 8px ${tone}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-white leading-none">{score}</span>
        <span className="text-xs font-medium text-slate-500 mt-1">out of 10</span>
      </div>
    </div>
  );
}

function IssueItem({ issue }) {
  const sev = issue.severity?.toLowerCase() || 'info';
  const s = SEVERITY_STYLES[sev] || SEVERITY_STYLES.info;
  return (
    <div className={`print-card surface relative overflow-hidden rounded-xl p-4 pl-5 transition-colors ${s.glow}`}>
      <span className={`absolute left-0 top-0 h-full w-1 ${s.bar}`} />
      <div className="flex items-start gap-3">
        <span
          className={`${s.badge} mt-0.5 flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset`}
        >
          {sev}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-500 break-all">{issue.file}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{issue.description}</p>
        </div>
      </div>
    </div>
  );
}

function CodeWindow({ filename, content }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="print-card overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.03] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-slate-400">{filename}</span>
        <button
          onClick={copy}
          className="no-print ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <Icon d={copied ? ICONS.check : ICONS.copy} className="w-3.5 h-3.5" />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-[28rem] overflow-auto p-5 font-mono text-[12.5px] leading-relaxed text-slate-300 whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}

function SeverityBar({ critical, warning, info }) {
  const total = critical + warning + info;
  if (!total) return null;
  const items = [
    ['critical', critical],
    ['warning', warning],
    ['info', info],
  ];
  return (
    <div className="no-print mb-4">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {items.map(([k, n]) => n > 0 && <div key={k} className={SEVERITY_STYLES[k].bar} style={{ width: `${(n / total) * 100}%` }} />)}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
        {items.map(([k, n]) => (
          <span key={k} className="inline-flex items-center gap-1.5 capitalize">
            <span className={`h-2 w-2 rounded-full ${SEVERITY_STYLES[k].dot}`} />
            {n} {k}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ResultsView({ agentStates, onReset }) {
  const explorerResult = agentStates.explorer?.result;
  const reviewerResult = agentStates.reviewer?.result;
  const docResult = agentStates.doc?.result;
  const reporterResult = agentStates.reporter?.result;
  const refactorResult = agentStates.refactor?.result;

  const isDone = AGENT_ORDER.every(
    (a) => agentStates[a]?.status === 'done' || agentStates[a]?.status === 'error'
  );

  const criticalIssues = reviewerResult?.filter((i) => i.severity === 'critical') || [];
  const warningIssues = reviewerResult?.filter((i) => i.severity === 'warning') || [];
  const infoIssues = reviewerResult?.filter((i) => i.severity === 'info') || [];

  const verdict =
    reporterResult?.score >= 8
      ? ['Excellent', 'Well-structured codebase', 'text-emerald-300 bg-emerald-500/10 ring-emerald-400/25']
      : reporterResult?.score >= 5
      ? ['Fair', 'Some improvements needed', 'text-amber-300 bg-amber-500/10 ring-amber-400/25']
      : ['At risk', 'Needs significant attention', 'text-red-300 bg-red-500/10 ring-red-400/25'];

  return (
    <div className="app-bg min-h-screen print-container">
      <div className="relative z-10 mx-auto max-w-4xl space-y-10 px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <header className="print-header flex flex-wrap items-center justify-between gap-4 animate-fade-up">
          <div className="min-w-0">
            <p className="eyebrow mb-1.5">AutoReview Agent · Audit report</p>
            <h1 className="truncate text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {explorerResult ? (
                <>
                  <span className="text-slate-500 font-semibold">{explorerResult.owner} / </span>
                  {explorerResult.repo}
                </>
              ) : (
                <span className="inline-block h-8 w-56 rounded-lg bg-white/[0.06] animate-pulse align-middle" />
              )}
            </h1>
          </div>
          {isDone && (
            <div className="no-print flex items-center gap-2.5">
              <button onClick={() => window.print()} className="btn-ghost">
                <Icon d={ICONS.download} />
                Export PDF
              </button>
              <button onClick={onReset} className="btn-ghost">
                <Icon d={ICONS.refresh} />
                New analysis
              </button>
            </div>
          )}
        </header>

        <Pipeline agentStates={agentStates} />

        {/* Explorer metrics */}
        {explorerResult && (
          <section className="animate-fade-up">
            <SectionHeading title="Repository overview" />
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Files" value={explorerResult.fileCount} icon={ICONS.files} />
              <MetricCard label="Framework" value={explorerResult.framework} icon={ICONS.stack} />
              <MetricCard label="Language" value={explorerResult.language} icon={ICONS.code} />
            </div>
          </section>
        )}

        {/* Audit report */}
        {reporterResult && (
          <section className="animate-fade-up">
            <SectionHeading title="Audit report" />
            <div className="surface print-card rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
                <ScoreRing score={reporterResult.score} />
                <div className="text-center sm:text-left">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${verdict[2]}`}
                  >
                    {verdict[0]}
                  </span>
                  <p className="mt-2 text-xl font-semibold text-white">{verdict[1]}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{reporterResult.summary}</p>
                </div>
              </div>

              {reporterResult.priorities?.length > 0 && (
                <div className="mt-8 border-t border-white/[0.07] pt-6">
                  <p className="eyebrow mb-4">Top priorities</p>
                  <ol className="space-y-3">
                    {reporterResult.priorities.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                      >
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 font-mono text-xs font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-400/25">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-slate-300">{p}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Code issues */}
        {reviewerResult && reviewerResult.length > 0 && (
          <section className="animate-fade-up">
            <SectionHeading title="Code issues" count={reviewerResult.length} />
            <SeverityBar critical={criticalIssues.length} warning={warningIssues.length} info={infoIssues.length} />
            <div className="space-y-2.5">
              {criticalIssues.map((issue, i) => <IssueItem key={`c${i}`} issue={issue} />)}
              {warningIssues.map((issue, i) => <IssueItem key={`w${i}`} issue={issue} />)}
              {infoIssues.map((issue, i) => <IssueItem key={`i${i}`} issue={issue} />)}
            </div>
          </section>
        )}
        {agentStates.reviewer?.status === 'done' && reviewerResult?.length === 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] p-4 text-sm text-emerald-300">
            <Icon d={ICONS.check} className="w-5 h-5" />
            No issues found in the reviewed files.
          </div>
        )}

        {/* Refactor suggestions */}
        {refactorResult?.length > 0 && (
          <section className="animate-fade-up">
            <SectionHeading title="Refactor suggestions" count={refactorResult.length} />
            <div className="space-y-5">
              {refactorResult.map((s, i) => (
                <div key={i} className="print-card overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] bg-white/[0.03] px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{s.title}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500 break-all">{s.file}</p>
                    </div>
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300 ring-1 ring-inset ring-indigo-400/25">
                      Suggestion {i + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-white/[0.07]">
                    <div className="bg-red-500/[0.04] p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-red-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Before
                      </p>
                      <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-slate-400 whitespace-pre-wrap">{s.before}</pre>
                    </div>
                    <div className="bg-emerald-500/[0.04] p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> After
                      </p>
                      <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{s.after}</pre>
                    </div>
                  </div>
                  <div className="border-t border-white/[0.07] bg-white/[0.02] px-5 py-3">
                    <p className="text-xs leading-relaxed text-slate-400">
                      <span className="font-semibold text-slate-300">Why · </span>
                      {s.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* README */}
        {docResult?.generatedReadme && (
          <section className="animate-fade-up">
            <SectionHeading title="Generated README" />
            <CodeWindow filename="README.md · auto-generated" content={docResult.generatedReadme} />
          </section>
        )}
        {agentStates.doc?.status === 'done' && !docResult?.generatedReadme && docResult?.existingReadme && (
          <section className="animate-fade-up">
            <SectionHeading title="Existing README" />
            <CodeWindow filename="README.md" content={docResult.existingReadme} />
          </section>
        )}

        {isDone && (
          <div className="no-print pb-8 text-center">
            <button onClick={onReset} className="btn-ghost">
              <Icon d={ICONS.refresh} />
              Analyze another repo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
