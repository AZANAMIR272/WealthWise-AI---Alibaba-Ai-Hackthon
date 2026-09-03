import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

/**
 * Returns a GenerativeModel wrapper with automatic fallback.
 * If the primary model returns 503 / overloaded, falls back to secondary.
 */
export function getReliableModel(genAI: GoogleGenerativeAI): GenerativeModel {
  const primary = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
  const fallback = genAI.getGenerativeModel({ model: FALLBACK_MODEL });

  const origGenerate = primary.generateContent.bind(primary);
  primary.generateContent = async (request: any) => {
    try {
      return await origGenerate(request);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (isOverloaded(msg)) {
        console.warn(`[AI] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`);
        return await fallback.generateContent(request);
      }
      throw e;
    }
  };

  return primary;
}

/**
 * Streaming version — yields text chunks as they arrive.
 * Falls back to secondary model on 503.
 */
export async function* streamReliable(genAI: GoogleGenerativeAI, prompt: any): AsyncGenerator<string> {
  const primary = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
  const fallback = genAI.getGenerativeModel({ model: FALLBACK_MODEL });

  try {
    const result = await primary.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (isOverloaded(msg)) {
      console.warn(`[AI] ${PRIMARY_MODEL} stream unavailable, falling back to ${FALLBACK_MODEL}`);
      const result = await fallback.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        yield chunk.text();
      }
    } else {
      throw e;
    }
  }
}

function isOverloaded(msg: string): boolean {
  return msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand') || msg.includes('Service Unavailable');
}
