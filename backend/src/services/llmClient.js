import { env } from '../config/env.js';

export const hasLlm = () => Boolean(env.llmApiKey);

/**
 * Calls an OpenAI-compatible /chat/completions endpoint (Groq by default).
 * Returns the reply text, or null on any failure so callers can fall back to rule-based output.
 */
export async function chatCompletion(messages, { maxTokens = 500, temperature = 0.3 } = {}) {
  if (!hasLlm()) return null;
  try {
    const res = await fetch(`${env.llmBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.llmApiKey}` },
      body: JSON.stringify({ model: env.llmModel, messages, max_tokens: maxTokens, temperature }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.warn(`LLM request failed with ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn(`LLM request failed: ${err.message}`);
    return null;
  }
}
