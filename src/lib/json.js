/**
 * Extracts and parses the first JSON value of the expected shape from an LLM reply.
 * Tolerates ```json fences and prose around the payload. Throws if nothing parses.
 */
export function parseModelJson(text, shape = 'array') {
  const [open, close] = shape === 'array' ? ['[', ']'] : ['{', '}'];
  const start = text.indexOf(open);
  const end = text.lastIndexOf(close);
  if (start === -1 || end <= start) {
    throw new Error('The model did not return valid JSON. Try again.');
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error('The model returned malformed or truncated JSON. Try again.');
  }
}

const SEVERITIES = ['critical', 'warning', 'info'];

export function normalizeSeverity(value) {
  const s = String(value ?? '').toLowerCase();
  if (SEVERITIES.includes(s)) return s;
  if (['high', 'error', 'major', 'severe'].includes(s)) return 'critical';
  if (['medium', 'warn', 'moderate'].includes(s)) return 'warning';
  return 'info';
}
