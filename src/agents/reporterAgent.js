import { groq } from '../lib/groq.js';
import { parseModelJson } from '../lib/json.js';

export async function reporterAgent(explorerResult, reviewerResult, docResult, apiKey) {
  const issuesSummary =
    reviewerResult
      .map((i) => `- [${i.severity.toUpperCase()}] ${i.file}: ${i.description}`)
      .join('\n') || 'No issues found.';

  const systemPrompt =
    'You are a senior engineer. Based on this code audit data, produce a structured report. Return JSON only, no markdown: { "score": number (1-10), "summary": string (2-3 sentences), "priorities": [string, string, string] }';

  const userMessage = `Produce a structured audit report for this repository:

**Repository:** ${explorerResult.owner}/${explorerResult.repo}
**Framework:** ${explorerResult.framework}
**Language:** ${explorerResult.language}
**File count:** ${explorerResult.fileCount}

**Code Review Issues:**
${issuesSummary}

**README status:** ${docResult.generatedReadme ? 'Missing or too short — a new README was generated.' : 'README is present.'}`;

  const text = await groq(apiKey, systemPrompt, userMessage);
  const report = parseModelJson(text, 'object');

  const score = Number(report.score);
  return {
    score: Number.isFinite(score) ? Math.max(1, Math.min(10, score)) : 5,
    summary: String(report.summary ?? ''),
    priorities: Array.isArray(report.priorities) ? report.priorities.map(String) : [],
  };
}
