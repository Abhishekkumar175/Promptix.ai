import sql from "../configs/db.js";
import { processDocument, findRelevantChunks } from "../services/pdfService.js";
import { streamChat } from "../services/aiService.js";

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
    SELECT id, file_name, status, full_text FROM pdf_files
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
    // Check if text exists
    if (!file.full_text) {
      res.write(`data: ${JSON.stringify({ type: "token", content: "Document has no text content." })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "done", citations: [] })}\n\n`);
      res.end();
      return;
    }

    // Build context directly using Gemini 2.0's 1M context window
    const systemPrompt = `You are an expert document analyst. Answer the user's question based ONLY on the provided document below.
- Be concise, clear, and precise.
- If the answer is in the document, summarize it with structural clarity.
- If the answer is NOT in the document, say "I couldn't find that in the document."
- Use markdown formatting for structured answers.

Document Name: "${file.file_name}"
Full Document Text:
"${file.full_text.slice(0, 300000)}"`; // Cap at 300k chars for safety though 2.0 handles more

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

    res.write(`data: ${JSON.stringify({ type: "done", citations: ["Full Document"] })}\n\n`);
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
