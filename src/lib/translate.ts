import "server-only";

/**
 * Automatic Spanish → English translation with MyMemory (free, no account).
 * Free quota: ~5,000 characters/day per IP, or ~50,000 when MYMEMORY_EMAIL is
 * set. Texts are only translated when saved in the dashboard, never per visit.
 */

const ENDPOINT = "https://api.mymemory.translated.net/get";
const MAX_CHUNK_BYTES = 450; // MyMemory accepts up to 500 bytes per request
const CONCURRENCY = 4;

const byteLength = (s: string) => new TextEncoder().encode(s).length;

function splitIntoChunks(line: string): string[] {
  const sentences = line.split(/(?<=[.!?…])\s+/);
  const chunks: string[] = [];
  let current = "";
  const push = () => {
    if (current) chunks.push(current);
    current = "";
  };
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (byteLength(candidate) <= MAX_CHUNK_BYTES) {
      current = candidate;
      continue;
    }
    push();
    if (byteLength(sentence) <= MAX_CHUNK_BYTES) {
      current = sentence;
      continue;
    }
    for (const word of sentence.split(/\s+/)) {
      const withWord = current ? `${current} ${word}` : word;
      if (byteLength(withWord) > MAX_CHUNK_BYTES) push();
      current = current ? `${current} ${word}` : word;
    }
  }
  push();
  return chunks;
}

function decodeEntities(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function translateChunk(chunk: string): Promise<string | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", chunk);
  url.searchParams.set("langpair", "es|en");
  if (process.env.MYMEMORY_EMAIL) url.searchParams.set("de", process.env.MYMEMORY_EMAIL);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { responseStatus?: number | string; responseData?: { translatedText?: string } };
    const translated = json.responseData?.translatedText;
    if (Number(json.responseStatus) !== 200 || !translated || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated)) {
      return null;
    }
    return decodeEntities(translated).trim();
  } catch {
    return null;
  }
}

async function translateOne(text: string): Promise<string | null> {
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (!line.trim()) {
      out.push(line);
      continue;
    }
    const parts: string[] = [];
    for (const chunk of splitIntoChunks(line.trim())) {
      const translated = await translateChunk(chunk);
      if (translated === null) return null;
      parts.push(translated);
    }
    out.push(parts.join(" "));
  }
  return out.join("\n");
}

/** Translates several texts; returns `null` for those that failed. */
export async function translateEsToEn(texts: string[]): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(texts.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < texts.length) {
      const index = next++;
      results[index] = await translateOne(texts[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, texts.length) }, worker));
  return results;
}
