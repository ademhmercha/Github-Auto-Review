import { groq } from '../lib/groq.js';

export async function docAgent(explorerResult, apiKey) {
  const readmeFile = explorerResult.keyFiles.find(
    (f) => f.name.toLowerCase() === 'readme.md'
  );
  const readmeContent = readmeFile?.content || '';

  if (readmeContent.length >= 100) {
    return { generatedReadme: null, existingReadme: readmeContent };
  }

  const filesSummary = explorerResult.keyFiles
    .filter((f) => f.name.toLowerCase() !== 'readme.md')
    .map((f) => `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n');

  const systemPrompt =
    'You are a technical writer. Generate a complete README.md for this project based on the code provided. Include: project title, description, installation, usage, and tech stack sections. Return only the markdown content, no extra commentary.';

  const userMessage = `Generate a README.md for this project:

**Framework:** ${explorerResult.framework}
**Language:** ${explorerResult.language}
**File count:** ${explorerResult.fileCount}
**Repository:** ${explorerResult.owner}/${explorerResult.repo}

${filesSummary || 'No source files available.'}`;

  const generatedReadme = await groq(apiKey, systemPrompt, userMessage);
  return { generatedReadme, existingReadme: null };
}
