import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { getEmbedding } from "./embeddingService.js";
import sql from "../configs/db.js";

const CHUNK_SIZE = 400;     // words per chunk
const CHUNK_OVERLAP = 50;   // words overlap between chunks

/**
 * Extract raw text from buffer.
 * Supports PDF and DOCX.
 */
export async function extractText(buffer, mimeType) {
  if (mimeType === "application/pdf") {
    const data = await pdfParse(buffer);
    return { text: data.text, pageCount: data.numpages };
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const { value } = await mammoth.extractRawText({ buffer });
    return { text: value, pageCount: 1 };
  }
  // Plain text
  return { text: buffer.toString("utf-8"), pageCount: 1 };
}

/**
 * Split text into overlapping word chunks.
 * Returns [{ chunkIndex, content, pageNumber }]
 */
export function chunkText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    if (chunk.trim().length > 20) { // skip tiny chunks
      chunks.push({ chunkIndex, content: chunk, pageNumber: Math.floor(i / 300) + 1 });
      chunkIndex++;
    }
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

/**
 * Process a PDF/DOCX file:
 * 1. Extract text
 * 2. Chunk it
 * 3. Embed each chunk with Gemini
 * 4. Store chunks in DB
 * Updates pdf_files status to 'ready' when done.
 */
export async function processDocument({ fileId, buffer, mimeType }) {
  try {
    const { text, pageCount } = await extractText(buffer, mimeType);
    const chunks = chunkText(text);

    // Embed all chunks (with a small delay to avoid rate limits)
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.content);

      await sql`
        INSERT INTO pdf_chunks (file_id, chunk_index, page_number, content, embedding)
        VALUES (
          ${fileId},
          ${chunk.chunkIndex},
          ${chunk.pageNumber},
          ${chunk.content},
          ${JSON.stringify(embedding)}
        )
      `;

      // Small delay between embeddings to respect free tier rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    // Mark file as ready
    await sql`
      UPDATE pdf_files
      SET status = 'ready', page_count = ${pageCount}, chunk_count = ${chunks.length}
      WHERE id = ${fileId}
    `;

    return { pageCount, chunkCount: chunks.length };
  } catch (err) {
    await sql`UPDATE pdf_files SET status = 'failed' WHERE id = ${fileId}`;
    throw err;
  }
}

/**
 * Find the top-K most relevant chunks for a query.
 * Uses in-memory cosine similarity (no Pinecone needed).
 */
export async function findRelevantChunks({ fileId, query, topK = 5 }) {
  // Embed the query
  const queryEmbedding = await getEmbedding(query);

  // Fetch all chunks for this file
  const chunks = await sql`
    SELECT id, chunk_index, page_number, content, embedding
    FROM pdf_chunks
    WHERE file_id = ${fileId}
  `;

  if (chunks.length === 0) return [];

  // Compute cosine similarity for each chunk
  const { cosineSimilarity } = await import("./embeddingService.js");
  const scored = chunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by score descending and take top K
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
