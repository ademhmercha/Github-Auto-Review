import { groq } from '../lib/groq.js';

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

  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { score: 5, summary: 'Unable to generate summary.', priorities: [] };
  }
}
