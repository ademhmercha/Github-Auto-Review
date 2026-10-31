import { groq } from '../lib/groq.js';
import { parseModelJson } from '../lib/json.js';

export async function refactorAgent(explorerResult, reviewerResult, apiKey) {
  const filesSummary = explorerResult.keyFiles
    .map((f) => `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n');

  const issuesSummary = reviewerResult
    .map((i) => `- [${i.severity.toUpperCase()}] ${i.file}: ${i.description}`)
    .join('\n') || 'No prior issues found.';

  const systemPrompt =
    'You are a senior software engineer specialized in code refactoring. Suggest concrete code transformations. Return a JSON array only, no markdown: [{ "file": string, "title": string, "before": string (short code snippet), "after": string (improved code snippet), "reason": string }]. Maximum 4 suggestions.';

  const userMessage = `Analyze this ${explorerResult.framework} (${explorerResult.language}) project and suggest concrete refactoring transformations:

**Known issues from code review:**
${issuesSummary}

**Source files:**
${filesSummary}`;

  const text = await groq(apiKey, systemPrompt, userMessage, { maxTokens: 3072 });
  const suggestions = parseModelJson(text, 'array');

  return suggestions
    .filter((s) => s && typeof s === 'object')
    .slice(0, 4)
    .map((s) => ({
      file: String(s.file ?? 'unknown'),
      title: String(s.title ?? 'Suggestion'),
      before: String(s.before ?? ''),
      after: String(s.after ?? ''),
      reason: String(s.reason ?? ''),
    }));
}
