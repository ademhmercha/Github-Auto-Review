import { useState, useEffect } from 'react';
import Reveal, { useCountUp } from './Reveal.jsx';

const AGENT_LABELS = {
  explorer: { label: 'Explorer', desc: 'Mapping repo structure' },
  reviewer: { label: 'Reviewer', desc: 'Analyzing code quality' },
  doc: { label: 'Docs', desc: 'Checking documentation' },
  reporter: { label: 'Reporter', desc: 'Generating audit report' },
  refactor: { label: 'Refactor', desc: 'Suggesting improvements' },
};

const AGENT_ORDER = ['explorer', 'reviewer', 'doc', 'reporter', 'refactor'];

const SEVERITY = {
  critical: { tag: 'bg-blood text-paper', bar: 'bg-blood', dot: 'bg-blood' },
  warning: { tag: 'bg-gold text-ink', bar: 'bg-gold', dot: 'bg-gold' },
  info: { tag: 'bg-ink text-paper', bar: 'bg-ink/40', dot: 'bg-ink/40' },
};

function SectionHeading({ index, title, count }) {
  return (
    <div className="mb-6 flex items-baseline gap-4 border-b-[1.5px] border-ink pb-3">
      <span className="font-mono text-xs text-ember">{index}</span>
      <h2 className="font-display text-4xl leading-none sm:text-5xl">{title}</h2>
      {count !== undefined && <span className="ml-auto font-mono text-sm text-ink/50">{count} items</span>}
    </div>
  );
}

function StepNode({ status, index }) {
  const base = 'relative z-10 flex h-10 w-10 items-center justify-center border-[1.5px] font-mono text-sm font-bold transition-all duration-500';
  if (status === 'done')
    return (
      <span className={`${base} border-ink bg-ink text-paper`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  if (status === 'error')
    return <span className={`${base} border-blood bg-blood text-paper`}>!</span>;
  if (status === 'running')
    return (
      <span className={`${base} border-ember bg-card pulse-ember`}>
        <span className="spinner h-4 w-4 rounded-full border-2 border-ember border-t-transparent" />
      </span>
    );
  return <span className={`${base} border-ink/25 bg-paper text-ink/30`}>{index + 1}</span>;
}

function Pipeline({ agentStates }) {
  const finished = AGENT_ORDER.filter((k) => ['done', 'error'].includes(agentStates[k]?.status)).length;
  const pct = (finished / (AGENT_ORDER.length - 1)) * 100;

  return (
    <div className="no-print slab p-6 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <p className="eyebrow">Pipeline</p>
        <p className="font-mono text-xs text-ink/50">
          {finished}/{AGENT_ORDER.length}
        </p>
      </div>

      <div className="relative">
        {/* connector line (desktop) */}
        <div className="absolute left-5 right-5 top-5 hidden h-[2px] bg-ink/15 sm:block">
          <div
            className="h-full bg-ink transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>

        <ol className="relative grid grid-cols-1 gap-5 sm:grid-cols-5 sm:gap-2">
          {AGENT_ORDER.map((key, i) => {
            const state = agentStates[key] || { status: 'waiting' };
            const meta = AGENT_LABELS[key];
            return (
              <li key={key} className="flex min-w-0 items-center gap-4 sm:flex-col sm:gap-3 sm:text-center">
                <StepNode status={state.status} index={i} />
                <div className="min-w-0 sm:px-1">
                  <p className={`text-sm font-semibold ${state.status === 'waiting' ? 'text-ink/35' : ''}`}>
                    {meta.label}
                  </p>
                  <p
                    className={`truncate font-mono text-[11px] ${
                      state.status === 'running'
                        ? 'text-ember'
                        : state.status === 'error'
                        ? 'text-blood'
                        : 'text-ink/40'
                    }`}
                    title={state.error}
                  >
                    {state.status === 'running' && `${meta.desc}…`}
                    {state.status === 'done' && 'done'}
                    {state.status === 'error' && (state.error || 'failed')}
                    {state.status === 'waiting' && 'queued'}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="print-card slab min-w-0 p-5 transition-transform duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5">
      <p className="eyebrow mb-3">{label}</p>
      <p className="truncate font-display text-3xl sm:text-4xl" title={String(value)}>
        {value || '—'}
      </p>
    </div>
  );
}

function ScoreRing({ score, tone }) {
  const [armed, setArmed] = useState(false);
  const shown = useCountUp(score, 1500);
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 150);
    return () => clearTimeout(t);
  }, []);

  const r = 70;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(10, Number(score) || 0));

  return (
    <div className="relative h-48 w-48 flex-shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#16140f" strokeOpacity="0.1" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="10"
          strokeDasharray={c}
          strokeDashoffset={armed ? c * (1 - clamped / 10) : c}
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-7xl leading-none">{Number.isInteger(shown) ? shown : shown.toFixed(1)}</span>
        <span className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/45">/ 10</span>
      </div>
    </div>
  );
}

function IssueItem({ issue, index }) {
  const sev = issue.severity?.toLowerCase() || 'info';
  const s = SEVERITY[sev] || SEVERITY.info;
  return (
    <Reveal delay={Math.min(index, 6) * 60}>
      <div className="print-card group relative flex gap-4 border-[1.5px] border-ink/15 bg-card p-4 pl-5 transition-all duration-300 hover:border-ink hover:bg-white hover:shadow-[4px_4px_0_0_#16140f] hover:-translate-x-0.5 hover:-translate-y-0.5">
        <span className={`absolute left-0 top-0 h-full w-1.5 ${s.bar}`} />
        <span className="select-none pt-0.5 font-mono text-sm font-bold text-blood">−</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`${s.tag} px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest`}>
              {sev}
            </span>
            <span className="break-all font-mono text-xs text-ink/50">{issue.file}</span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">{issue.description}</p>
        </div>
      </div>
    </Reveal>
  );
}

function DiffBlock({ text, sign }) {
  const lines = String(text ?? '').split('\n');
  const del = sign === '-';
  return (
    <pre className="overflow-x-auto py-2 font-mono text-[12.5px] leading-6">
      {lines.map((ln, i) => (
        <div key={i} className={`flex px-3 ${del ? 'bg-blood/[0.08] text-ink/60' : 'bg-moss/[0.1] text-ink'}`}>
          <span className={`w-5 flex-shrink-0 select-none font-bold ${del ? 'text-blood' : 'text-moss'}`}>{sign}</span>
          <span className="whitespace-pre-wrap break-words">{ln || ' '}</span>
        </div>
      ))}
    </pre>
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
    <div className="print-card border-[1.5px] border-ink bg-ink text-paper shadow-[6px_6px_0_0_#ff4b1f]">
      <div className="flex items-center gap-3 border-b border-paper/15 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ember" />
        <span className="font-mono text-xs text-paper/70">{filename}</span>
        <button
          onClick={copy}
          className="no-print ml-auto font-mono text-[11px] uppercase tracking-wider text-paper/60 transition-colors hover:text-ember"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="max-h-[30rem] overflow-auto whitespace-pre-wrap p-5 font-mono text-[12.5px] leading-relaxed text-paper/85">
        {content}
      </pre>
    </div>
  );
}

function SeverityBar({ critical, warning, info }) {
  const total = critical + warning + info;
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 100);
    return () => clearTimeout(t);
  }, []);
  if (!total) return null;
  const items = [
    ['critical', critical],
    ['warning', warning],
    ['info', info],
  ];
  return (
    <div className="no-print mb-6">
      <div className="flex h-2 w-full gap-0.5 overflow-hidden">
        {items.map(
          ([k, n]) =>
            n > 0 && (
              <div
                key={k}
                className={`${SEVERITY[k].bar} transition-all duration-1000 ease-out`}
                style={{ width: armed ? `${(n / total) * 100}%` : '0%' }}
              />
            )
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-ink/60">
        {items.map(([k, n]) => (
          <span key={k} className="inline-flex items-center gap-2">
            <span className={`h-2 w-2 ${SEVERITY[k].dot}`} />
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
  const orderedIssues = [...criticalIssues, ...warningIssues, ...infoIssues];

  const verdict =
    reporterResult?.score >= 8
      ? { word: 'Excellent', line: 'A well-structured codebase.', color: '#2f7d4f' }
      : reporterResult?.score >= 5
      ? { word: 'Fair', line: 'Some improvements needed.', color: '#c98a00' }
      : { word: 'At risk', line: 'Needs significant attention.', color: '#c0301c' };

  let sectionNo = 0;
  const num = () => String(++sectionNo).padStart(2, '0');

  return (
    <div className="print-container min-h-screen">
      <div className="mx-auto max-w-4xl space-y-16 px-5 py-8 md:px-8 md:py-12">
        {/* Header */}
        <header className="print-header rise-in flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center bg-ink font-mono text-xs font-bold text-ember">±</span>
              <p className="eyebrow">AutoReview · audit report</p>
            </div>
            <h1 className="break-words font-display text-5xl leading-[0.95] sm:text-7xl">
              {explorerResult ? (
                <>
                  <span className="text-ink/35">{explorerResult.owner}/</span>
                  <br className="sm:hidden" />
                  {explorerResult.repo}
                </>
              ) : (
                <span className="inline-block h-14 w-72 max-w-full bg-ink/10 align-middle animate-pulse" />
              )}
            </h1>
          </div>
          {isDone && (
            <div className="no-print flex items-center gap-3">
              <button onClick={() => window.print()} className="btn-line">
                Export PDF ↓
              </button>
              <button onClick={onReset} className="btn-line">
                New analysis ↺
              </button>
            </div>
          )}
        </header>

        <Pipeline agentStates={agentStates} />

        {/* Overview */}
        {explorerResult && (
          <Reveal as="section">
            <SectionHeading index={num()} title="Overview" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Metric label="Files" value={explorerResult.fileCount} />
              <Metric label="Framework" value={explorerResult.framework} />
              <Metric label="Language" value={explorerResult.language} />
            </div>
          </Reveal>
        )}

        {/* Audit report */}
        {reporterResult && (
          <Reveal as="section">
            <SectionHeading index={num()} title="Verdict" />
            <div className="print-card slab relative overflow-hidden p-6 sm:p-10">
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-12">
                <ScoreRing score={reporterResult.score} tone={verdict.color} />
                <div className="relative text-center sm:text-left">
                  <span
                    className="stamp mb-4 inline-block border-[3px] px-3 py-1 font-mono text-sm font-bold uppercase tracking-[0.2em]"
                    style={{ color: verdict.color, borderColor: verdict.color }}
                  >
                    {verdict.word}
                  </span>
                  <p className="font-display text-3xl leading-tight sm:text-4xl">{verdict.line}</p>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink/70">{reporterResult.summary}</p>
                </div>
              </div>

              {reporterResult.priorities?.length > 0 && (
                <div className="mt-10 border-t-[1.5px] border-ink pt-7">
                  <p className="eyebrow mb-5">Top priorities</p>
                  <ol className="space-y-px bg-ink/15">
                    {reporterResult.priorities.map((p, i) => (
                      <li
                        key={i}
                        className="group flex items-start gap-5 bg-card p-4 transition-colors duration-300 hover:bg-white"
                      >
                        <span className="font-display text-4xl leading-none text-ember transition-transform duration-300 group-hover:translate-x-1">
                          {i + 1}
                        </span>
                        <span className="pt-1 text-[15px] leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* Issues */}
        {orderedIssues.length > 0 && (
          <section>
            <Reveal>
              <SectionHeading index={num()} title="Issues" count={orderedIssues.length} />
              <SeverityBar critical={criticalIssues.length} warning={warningIssues.length} info={infoIssues.length} />
            </Reveal>
            <div className="space-y-3">
              {orderedIssues.map((issue, i) => (
                <IssueItem key={i} issue={issue} index={i} />
              ))}
            </div>
          </section>
        )}
        {agentStates.reviewer?.status === 'done' && reviewerResult?.length === 0 && (
          <Reveal className="border-[1.5px] border-moss bg-moss/10 p-5 font-mono text-sm text-moss">
            ✓ No issues found in the reviewed files.
          </Reveal>
        )}

        {/* Refactor */}
        {refactorResult?.length > 0 && (
          <section>
            <Reveal>
              <SectionHeading index={num()} title="Refactors" count={refactorResult.length} />
            </Reveal>
            <div className="space-y-8">
              {refactorResult.map((s, i) => (
                <Reveal key={i}>
                  <div className="print-card border-[1.5px] border-ink bg-card">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-[1.5px] border-ink px-5 py-3.5">
                      <p className="text-base font-semibold">{s.title}</p>
                      <p className="break-all font-mono text-xs text-ink/50">{s.file}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-[1.5px] divide-ink">
                      <div>
                        <p className="border-b border-ink/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-blood">
                          Before
                        </p>
                        <DiffBlock text={s.before} sign="-" />
                      </div>
                      <div>
                        <p className="border-b border-ink/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-moss">
                          After
                        </p>
                        <DiffBlock text={s.after} sign="+" />
                      </div>
                    </div>
                    <div className="border-t-[1.5px] border-ink bg-paper px-5 py-3">
                      <p className="text-sm leading-relaxed">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-ember">Why </span>
                        {s.reason}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* README */}
        {docResult?.generatedReadme && (
          <Reveal as="section">
            <SectionHeading index={num()} title="README" />
            <CodeWindow filename="README.md — auto-generated" content={docResult.generatedReadme} />
          </Reveal>
        )}
        {agentStates.doc?.status === 'done' && !docResult?.generatedReadme && docResult?.existingReadme && (
          <Reveal as="section">
            <SectionHeading index={num()} title="README" />
            <CodeWindow filename="README.md" content={docResult.existingReadme} />
          </Reveal>
        )}

        {isDone && (
          <div className="no-print pb-10 text-center">
            <button onClick={onReset} className="btn-line">
              Analyze another repo ↺
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
