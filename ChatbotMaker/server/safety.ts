/**
 * Basic safety and prompt-injection filters.
 * This is intentionally conservative and meant as a first-line defense.
 */
const bannedTokenPatterns: RegExp[] = [
  // attempts to exfiltrate keys / secrets
  /api[_-]?key\b/i,
  /secret\b/i,
  /access[_-]?token\b/i,
  /private[_-]?key\b/i,
  /password\b/i,
  /ssh[_-]?key\b/i,
  /-----BEGIN PRIVATE KEY-----/i,
];

const promptInjectionPatterns: RegExp[] = [
  // common injection patterns: asking model to ignore previous instructions
  /ignore (previous|prior) instructions?/i,
  /disregard (the )?above/i,
  /forget (the )?above/i,
  /follow these instructions instead/i,
  /you are now (a|an) /i,
  /act as if you are/i,
  /pretend to be/i,
];

const bannedWords: string[] = [
  // optional: add profanity or PII-sensitive terms depending on application
];

export function detectSecretLeak(content: string): string | null {
  for (const p of bannedTokenPatterns) {
    if (p.test(content)) return `Possible secret or credential mention: ${p}`;
  }
  return null;
}

export function detectPromptInjection(content: string): string | null {
  for (const p of promptInjectionPatterns) {
    if (p.test(content)) return `Possible prompt-injection pattern: ${p}`;
  }
  return null;
}

export function simpleContentPolicy(content: string): { ok: boolean; reason?: string } {
  if (!content || typeof content !== "string") return { ok: false, reason: "Empty content" };

  const secret = detectSecretLeak(content);
  if (secret) return { ok: false, reason: secret };

  const injection = detectPromptInjection(content);
  if (injection) return { ok: false, reason: injection };

  // length check
  if (content.length > 50000) return { ok: false, reason: "Message too long" };

  // optional banned words
  for (const w of bannedWords) {
    if (content.toLowerCase().includes(w)) return { ok: false, reason: `Banned word: ${w}` };
  }

  return { ok: true };
}

// Express-style middleware helper (not importing express types to keep dependency-free)
export async function validateMessageContent(content: string) {
  const res = simpleContentPolicy(content);
  if (!res.ok) {
    return { ok: false, reason: res.reason };
  }
  return { ok: true };
}

export default {
  detectSecretLeak,
  detectPromptInjection,
  simpleContentPolicy,
  validateMessageContent,
};
