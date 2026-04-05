import sql from "../configs/db.js";
import { processDocument, findRelevantChunks } from "../services/pdfService.js";
import { streamChat } from "../services/geminiService.js";

// ── POST /api/pdf/upload ── Upload + start processing
export const uploadPDF = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { originalname, mimetype, buffer } = req.file;

    // Create DB record with 'processing' status
    const [file] = await sql`
      INSERT INTO pdf_files (user_id, file_name, status)
      VALUES (${userId}, ${originalname}, 'processing')
      RETURNING *
    `;

    // Process in background (non-blocking) 
    processDocument({ fileId: file.id, buffer, mimeType: mimetype })
      .then(({ pageCount, chunkCount }) => {
        console.log(`✓ PDF processed: ${originalname} | ${pageCount} pages | ${chunkCount} chunks`);
      })
      .catch(err => {
        console.error(`✗ PDF processing failed: ${originalname}`, err.message);
      });

    // Return immediately with fileId — frontend polls for status
    res.json({
      success: true,
      file: {
        id: file.id,
        fileName: file.file_name,
        status: "processing",
      },
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/pdf/files ── List user's uploaded files
export const listFiles = async (req, res) => {
  try {
    const { userId } = req.auth();
    const files = await sql`
      SELECT id, file_name, page_count, chunk_count, status, created_at
      FROM pdf_files
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    `;
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/pdf/files/:fileId/status ── Poll processing status
export const getFileStatus = async (req, res) => {
  try {
    const { userId } = req.auth();
    const [file] = await sql`
      SELECT id, file_name, page_count, chunk_count, status
      FROM pdf_files
      WHERE id = ${req.params.fileId} AND user_id = ${userId}
    `;
    if (!file) return res.status(404).json({ success: false, message: "File not found" });
    res.json({ success: true, file });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/pdf/files/:fileId ── Delete file + chunks
export const deleteFile = async (req, res) => {
  try {
    const { userId } = req.auth();
    await sql`
      DELETE FROM pdf_files WHERE id = ${req.params.fileId} AND user_id = ${userId}
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/pdf/query ── RAG-powered Q&A with streaming
export const queryPDF = async (req, res) => {
  const { userId } = req.auth();
  const { fileId, question } = req.body;

  if (!fileId || !question?.trim()) {
    return res.status(400).json({ success: false, message: "fileId and question are required" });
  }

  // Verify ownership + readiness
  const [file] = await sql`
    SELECT id, file_name, status FROM pdf_files
    WHERE id = ${fileId} AND user_id = ${userId}
  `;
  if (!file) return res.status(404).json({ success: false, message: "File not found" });
  if (file.status !== "ready") {
    return res.status(400).json({ success: false, message: "Document is still being processed. Please wait." });
  }

  // Set SSE headers for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  try {
    // Find the most relevant chunks
    const relevantChunks = await findRelevantChunks({ fileId, query: question, topK: 5 });

    if (relevantChunks.length === 0) {
      res.write(`data: ${JSON.stringify({ type: "token", content: "I couldn't find relevant content in the document for your question." })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "done", citations: [] })}\n\n`);
      res.end();
      return;
    }

    // Build context from retrieved chunks
    const context = relevantChunks
      .map((c, i) => `[Source ${i + 1} - Page ${c.page_number}]\n${c.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are an expert document analyst. Answer the user's question based ONLY on the provided document context below.
- If the answer is in the context, cite which source/page it came from.
- If the answer is NOT in the context, say "I couldn't find that in the document."
- Be concise, clear, and precise.
- Use markdown formatting for structured answers.

Document: "${file.file_name}"

Context from document:
${context}`;

    const citations = relevantChunks.map(c => `Page ${c.page_number}`);
    let fullResponse = "";

    await streamChat({
      history: [],
      userMessage: question,
      onChunk: (text) => {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ type: "token", content: text })}\n\n`);
      },
      systemOverride: systemPrompt,
    });

    // Send citations with done event
    res.write(`data: ${JSON.stringify({ type: "done", citations: [...new Set(citations)] })}\n\n`);
    res.end();

  } catch (err) {
    console.error("PDF query error:", err);
    const isRateLimit = err.message?.includes("Too Many Requests") || err.message?.includes("RESOURCE_EXHAUSTED");
    res.write(`data: ${JSON.stringify({
      type: "error",
      message: isRateLimit
        ? "⚠️ AI is temporarily busy. Please wait a moment and try again."
        : `⚠️ Error: ${err.message}`
    })}\n\n`);
    res.end();
  }
};
