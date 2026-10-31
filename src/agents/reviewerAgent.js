import { groq } from '../lib/groq.js';
import { parseModelJson, normalizeSeverity } from '../lib/json.js';

export async function reviewerAgent(explorerResult, apiKey) {
  const filesSummary = explorerResult.keyFiles
    .map((f) => `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n');

  const systemPrompt =
    "You are an expert code reviewer. Analyze the provided code and return a JSON array of issues. Each issue must have: { severity: 'critical'|'warning'|'info', file: string, description: string }. Return only valid JSON array, no markdown, no explanation.";

  const userMessage = `Review the following files from a ${explorerResult.framework} (${explorerResult.language}) project:\n\n${filesSummary}`;

  const text = await groq(apiKey, systemPrompt, userMessage);
  const issues = parseModelJson(text, 'array');

  return issues
    .filter((i) => i && typeof i === 'object')
    .map((i) => ({
      severity: normalizeSeverity(i.severity),
      file: String(i.file ?? 'unknown'),
      description: String(i.description ?? ''),
    }));
}
