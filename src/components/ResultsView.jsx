const AGENT_LABELS = {
  explorer: { label: 'Explorer Agent', desc: 'Mapping repo structure' },
  reviewer: { label: 'Code Reviewer Agent', desc: 'Analyzing code quality' },
  doc: { label: 'Doc Agent', desc: 'Checking documentation' },
  reporter: { label: 'Reporter Agent', desc: 'Generating audit report' },
};

const AGENT_ORDER = ['explorer', 'reviewer', 'doc', 'reporter'];

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-950', border: 'border-red-800', badge: 'bg-red-700 text-red-100', text: 'text-red-300' },
  warning: { bg: 'bg-amber-950', border: 'border-amber-800', badge: 'bg-amber-700 text-amber-100', text: 'text-amber-300' },
  info: { bg: 'bg-gray-800', border: 'border-gray-700', badge: 'bg-gray-600 text-gray-200', text: 'text-gray-400' },
};

function StatusIcon({ status }) {
  if (status === 'waiting') {
    return (
      <span className="w-6 h-6 rounded-full border-2 border-gray-700 flex items-center justify-center flex-shrink-0" />
    );
  }
  if (status === 'running') {
    return (
      <span className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
    );
  }
  if (status === 'done') {
    return (
      <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="w-6 h-6 rounded-full bg-red-700 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    );
  }
  return null;
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-white truncate">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function IssueItem({ issue }) {
  const sev = issue.severity?.toLowerCase() || 'info';
  const styles = SEVERITY_STYLES[sev] || SEVERITY_STYLES.info;
  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-3 flex gap-3`}>
      <span className={`${styles.badge} text-xs font-bold px-2 py-0.5 rounded uppercase flex-shrink-0 self-start mt-0.5`}>
        {sev}
      </span>
      <div>
        <p className="text-xs font-mono text-gray-400 mb-0.5">{issue.file}</p>
        <p className={`text-sm ${styles.text}`}>{issue.description}</p>
      </div>
    </div>
  );
}

export default function ResultsView({ agentStates, onReset }) {
  const explorerResult = agentStates.explorer?.result;
  const reviewerResult = agentStates.reviewer?.result;
  const docResult = agentStates.doc?.result;
  const reporterResult = agentStates.reporter?.result;

  const isDone = AGENT_ORDER.every(
    (a) => agentStates[a]?.status === 'done' || agentStates[a]?.status === 'error'
  );

  const criticalIssues = reviewerResult?.filter((i) => i.severity === 'critical') || [];
  const warningIssues = reviewerResult?.filter((i) => i.severity === 'warning') || [];
  const infoIssues = reviewerResult?.filter((i) => i.severity === 'info') || [];

  const scoreColor =
    reporterResult?.score >= 8
      ? 'text-emerald-400'
      : reporterResult?.score >= 5
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">AutoReview Agent</h1>
            {explorerResult && (
              <p className="text-sm text-gray-400 mt-0.5">
                {explorerResult.owner}/{explorerResult.repo}
              </p>
            )}
          </div>
          {isDone && (
            <button
              onClick={onReset}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Analyze another repo
            </button>
          )}
        </div>

        {/* Agent progress list */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Pipeline</p>
          {AGENT_ORDER.map((key) => {
            const state = agentStates[key] || { status: 'waiting' };
            const meta = AGENT_LABELS[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <StatusIcon status={state.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200">{meta.label}</p>
                  {state.status === 'running' && (
                    <p className="text-xs text-indigo-400">{meta.desc}...</p>
                  )}
                  {state.status === 'error' && (
                    <p className="text-xs text-red-400 truncate">{state.error}</p>
                  )}
                  {state.status === 'waiting' && (
                    <p className="text-xs text-gray-600">Waiting</p>
                  )}
                  {state.status === 'done' && (
                    <p className="text-xs text-emerald-500">Completed</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Explorer metrics */}
        {explorerResult && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Repository Overview</p>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Files" value={explorerResult.fileCount} />
              <MetricCard label="Framework" value={explorerResult.framework} />
              <MetricCard label="Language" value={explorerResult.language} />
            </div>
          </div>
        )}

        {/* Code issues */}
        {reviewerResult && reviewerResult.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Code Issues ({reviewerResult.length})
            </p>
            <div className="space-y-2">
              {criticalIssues.map((issue, i) => <IssueItem key={`c${i}`} issue={issue} />)}
              {warningIssues.map((issue, i) => <IssueItem key={`w${i}`} issue={issue} />)}
              {infoIssues.map((issue, i) => <IssueItem key={`i${i}`} issue={issue} />)}
            </div>
          </div>
        )}
        {agentStates.reviewer?.status === 'done' && reviewerResult?.length === 0 && (
          <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-4 text-sm text-emerald-300">
            No issues found in the reviewed files.
          </div>
        )}

        {/* Generated README */}
        {docResult?.generatedReadme && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Generated README.md
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 bg-gray-800/50">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-400 ml-1">README.md (auto-generated)</span>
              </div>
              <pre className="p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                {docResult.generatedReadme}
              </pre>
            </div>
          </div>
        )}
        {agentStates.doc?.status === 'done' && !docResult?.generatedReadme && docResult?.existingReadme && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Existing README.md
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 bg-gray-800/50">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-400 ml-1">README.md</span>
              </div>
              <pre className="p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                {docResult.existingReadme}
              </pre>
            </div>
          </div>
        )}

        {/* Reporter output */}
        {reporterResult && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Audit Report</p>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5">
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <span className={`text-5xl font-black ${scoreColor}`}>
                    {reporterResult.score}
                  </span>
                  <span className="text-gray-500 text-lg font-bold">/10</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200 mb-0.5">Quality Score</p>
                  <p className="text-xs text-gray-500">
                    {reporterResult.score >= 8
                      ? 'Excellent — well-structured codebase'
                      : reporterResult.score >= 5
                      ? 'Fair — some improvements needed'
                      : 'Needs significant attention'}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-800 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Summary</p>
                <p className="text-sm text-gray-300 leading-relaxed">{reporterResult.summary}</p>
              </div>

              {/* Priorities */}
              {reporterResult.priorities?.length > 0 && (
                <div className="border-t border-gray-800 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Top Priorities</p>
                  <ol className="space-y-2">
                    {reporterResult.priorities.map((p, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-300">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset button at bottom */}
        {isDone && (
          <div className="pt-2 pb-8 text-center">
            <button
              onClick={onReset}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 px-6 rounded-lg transition-colors text-sm border border-gray-700"
            >
              Analyze another repo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
