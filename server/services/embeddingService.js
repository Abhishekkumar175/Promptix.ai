import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get embedding vector for a text string.
 * Uses Gemini text-embedding-004 (768 dimensions, free).
 */
export async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text.slice(0, 2048)); // cap to 2048 chars
  return result.embedding.values; // float[]
}

/**
 * Cosine similarity between two equal-length float arrays.
 */
export function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
}
