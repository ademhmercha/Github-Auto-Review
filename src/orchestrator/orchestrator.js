import { explorerAgent } from '../agents/explorerAgent.js';
import { reviewerAgent } from '../agents/reviewerAgent.js';
import { docAgent } from '../agents/docAgent.js';
import { reporterAgent } from '../agents/reporterAgent.js';
import { refactorAgent } from '../agents/refactorAgent.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runOrchestrator(repoUrl, apiKey, onProgress) {
  let explorerResult = null;
  let reviewerResult = [];
  let docResult = { generatedReadme: null };
  let reporterResult = null;
  let refactorResult = [];

  // Agent 1: Explorer (no API call)
  onProgress({ agent: 'explorer', status: 'running' });
  try {
    explorerResult = await explorerAgent(repoUrl);
    onProgress({ agent: 'explorer', status: 'done', result: explorerResult });
  } catch (err) {
    onProgress({ agent: 'explorer', status: 'error', error: err.message });
    ['reviewer', 'doc', 'reporter', 'refactor'].forEach((a) =>
      onProgress({ agent: a, status: 'error', error: 'Skipped: Explorer failed' })
    );
    return null;
  }

  // Agent 2: Code Reviewer
  await sleep(1000);
  onProgress({ agent: 'reviewer', status: 'running' });
  try {
    reviewerResult = await reviewerAgent(explorerResult, apiKey);
    onProgress({ agent: 'reviewer', status: 'done', result: reviewerResult });
  } catch (err) {
    onProgress({ agent: 'reviewer', status: 'error', error: err.message });
    reviewerResult = [];
  }

  // Agent 3: Doc Agent
  await sleep(2000);
  onProgress({ agent: 'doc', status: 'running' });
  try {
    docResult = await docAgent(explorerResult, apiKey);
    onProgress({ agent: 'doc', status: 'done', result: docResult });
  } catch (err) {
    onProgress({ agent: 'doc', status: 'error', error: err.message });
    docResult = { generatedReadme: null };
  }

  // Agent 4: Reporter
  await sleep(2000);
  onProgress({ agent: 'reporter', status: 'running' });
  try {
    reporterResult = await reporterAgent(explorerResult, reviewerResult, docResult, apiKey);
    onProgress({ agent: 'reporter', status: 'done', result: reporterResult });
  } catch (err) {
    onProgress({ agent: 'reporter', status: 'error', error: err.message });
    reporterResult = null;
  }

  // Agent 5: Refactor
  await sleep(2000);
  onProgress({ agent: 'refactor', status: 'running' });
  try {
    refactorResult = await refactorAgent(explorerResult, reviewerResult, apiKey);
    onProgress({ agent: 'refactor', status: 'done', result: refactorResult });
  } catch (err) {
    onProgress({ agent: 'refactor', status: 'error', error: err.message });
    refactorResult = [];
  }

  return { explorerResult, reviewerResult, docResult, reporterResult, refactorResult };
}
