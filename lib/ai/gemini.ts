import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-3.8-flash';
const REQUEST_TIMEOUT_MS = 55_000;

type GeminiInput =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mime_type: string };

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini is not configured yet. Add GEMINI_API_KEY to .env.local, then restart StudyFlow.');
    error.name = 'MissingGeminiKeyError';
    throw error;
  }
  return new GoogleGenAI({ apiKey });
}

/** All Gemini calls run on the server and request JSON constrained by a JSON Schema. */
export async function generateStructured<T>(input: GeminiInput[], schema: Record<string, unknown>): Promise<T> {
  const client = getGeminiClient();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const contents = input.map((part) => part.type === 'text'
    ? { text: part.text }
    : { inlineData: { data: part.data, mimeType: part.mime_type } });

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(Object.assign(new Error('Gemini request timed out.'), { name: 'TimeoutError' })), REQUEST_TIMEOUT_MS);
  });
  const generation = client.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      temperature: 0.2,
    },
  });

  let response;
  try {
    response = await Promise.race([generation, timeout]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
  const output = response.text;
  if (!output) throw new Error('Gemini returned an empty response. Please retry with clearer notes.');
  try {
    return JSON.parse(output) as T;
  } catch {
    throw new Error('Gemini returned data that could not be read. Please retry.');
  }
}

export function publicAiError(error: unknown): { message: string; status: number } {
  const err = error as { name?: string; message?: string; status?: number; code?: number };
  const message = err?.message || 'An unexpected AI error occurred.';
  if (err?.name === 'MissingGeminiKeyError') return { message, status: 503 };
  if (err?.name === 'TimeoutError' || /timeout|timed out|deadline/i.test(message)) {
    return { message: 'Gemini took too long to respond. Try fewer pages or a smaller image set.', status: 504 };
  }
  if (/429|quota|rate.?limit|resource.?exhausted/i.test(message)) {
    return { message: 'Gemini is currently rate-limited or the free-tier quota is used up. Wait for the quota to reset, or check your Google AI Studio project limits.', status: 429 };
  }
  if (/404|not found|model/i.test(message)) return { message: `The configured Gemini model could not be found or is unavailable. Check GEMINI_MODEL. (${message.slice(0, 180)})`, status: 400 };
  if (/401|403|api.?key|permission/i.test(message)) return { message: 'Gemini rejected the API key or project permissions. Verify GEMINI_API_KEY in .env.local.', status: 401 };
  return { message: message.slice(0, 400), status: 500 };
}
