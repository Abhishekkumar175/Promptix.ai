import fs from "fs";
import path from "path";
import sql from "../configs/db.js";
import { processDocument } from "../services/pdfService.js";
import { streamDocumentChat } from "../services/geminiService.js";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "pdfs");

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── POST /api/pdf/upload ── Upload PDF & process
export const uploadPDF = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const { originalname, mimetype, buffer, size } = req.file;

    // Create DB record with 'processing' status
    const [file] = await sql`
      INSERT INTO pdf_files (user_id, file_name, file_size, status)
      VALUES (${userId}, ${originalname}, ${size || buffer.length}, 'processing')
      RETURNING *
    `;

    // Save physical file to disk for previewing
    const diskPath = path.join(UPLOADS_DIR, `${file.id}.pdf`);
    await fs.promises.writeFile(diskPath, buffer);

    // Process text extraction asynchronously
    processDocument({ fileId: file.id, buffer, mimeType: mimetype })
      .then(({ pageCount }) => {
        console.log(`✓ Document processed: ${originalname} (${pageCount} pages)`);
      })
      .catch((err) => {
        console.error(`✗ Document processing failed: ${originalname}:`, err.message);
      });

    res.json({
      success: true,
      file: {
        id: file.id,
        fileName: file.file_name,
        fileSize: file.file_size,
        status: "processing",
        createdAt: file.created_at,
      },
    });
  } catch (err) {
    console.error("PDF upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/pdf/files ── List user's documents
export const listFiles = async (req, res) => {
  try {
    const { userId } = req.auth();
    const files = await sql`
      SELECT id, file_name, file_size, page_count, status, created_at, updated_at
      FROM pdf_files
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 30
    `;
    res.json({ success: true, files });
  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/pdf/files/:fileId/status ── Poll status
export const getFileStatus = async (req, res) => {
  try {
    const { userId } = req.auth();
    const [file] = await sql`
      SELECT id, file_name, file_size, page_count, status
      FROM pdf_files
      WHERE id = ${req.params.fileId} AND user_id = ${userId}
    `;
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found." });
    }
    res.json({ success: true, file });
  } catch (err) {
    console.error("Get status error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/pdf/files/:fileId/view ── Serve raw PDF for preview
export const viewPDF = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { fileId } = req.params;

    const [file] = await sql`
      SELECT id, file_name FROM pdf_files
      WHERE id = ${fileId} AND user_id = ${userId}
    `;

    if (!file) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    const diskPath = path.join(UPLOADS_DIR, `${fileId}.pdf`);
    if (!fs.existsSync(diskPath)) {
      return res.status(404).json({ success: false, message: "Physical PDF file not found on server." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.file_name)}"`);
    res.sendFile(diskPath);
  } catch (err) {
    console.error("View PDF error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/pdf/files/:fileId/messages ── Get chat history
export const getPDFMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { fileId } = req.params;

    const [file] = await sql`
      SELECT id FROM pdf_files WHERE id = ${fileId} AND user_id = ${userId}
    `;
    if (!file) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    const messages = await sql`
      SELECT id, role, content, citations, created_at
      FROM pdf_messages
      WHERE file_id = ${fileId}
      ORDER BY created_at ASC
    `;

    res.json({ success: true, messages });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/pdf/files/:fileId ── Delete file & its chat
export const deleteFile = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { fileId } = req.params;

    await sql`
      DELETE FROM pdf_files WHERE id = ${fileId} AND user_id = ${userId}
    `;

    const diskPath = path.join(UPLOADS_DIR, `${fileId}.pdf`);
    if (fs.existsSync(diskPath)) {
      fs.unlink(diskPath, () => {});
    }

    res.json({ success: true, message: "Document deleted successfully." });
  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/pdf/query ── Stream Q&A with Gemini
export const queryPDF = async (req, res) => {
  const { userId } = req.auth();
  const { fileId, question } = req.body;

  if (!fileId || !question?.trim()) {
    return res.status(400).json({ success: false, message: "fileId and question are required." });
  }

  // Verify ownership and status
  const [file] = await sql`
    SELECT id, file_name, status, full_text, page_count FROM pdf_files
    WHERE id = ${fileId} AND user_id = ${userId}
  `;

  if (!file) {
    return res.status(404).json({ success: false, message: "File not found." });
  }

  if (file.status !== "ready") {
    return res.status(400).json({
      success: false,
      message: "Document is still being processed. Please wait a moment.",
    });
  }

  // Setup Server-Sent Events headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  try {
    // 1. Fetch past conversation history
    const pastMessages = await sql`
      SELECT role, content FROM pdf_messages
      WHERE file_id = ${fileId}
      ORDER BY created_at ASC
      LIMIT 20
    `;

    // 2. Save user message to database
    await sql`
      INSERT INTO pdf_messages (file_id, role, content)
      VALUES (${fileId}, 'user', ${question.trim()})
    `;

    // 3. Update pdf_files updated_at
    await sql`UPDATE pdf_files SET updated_at = NOW() WHERE id = ${fileId}`;

    let fullAssistantResponse = "";

    // 4. Stream response from Gemini 3.5 Flash
    await streamDocumentChat({
      fileName: file.file_name,
      documentText: file.full_text || "Document has no extractable text.",
      history: pastMessages,
      userQuestion: question.trim(),
      onChunk: (token) => {
        fullAssistantResponse += token;
        res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
      },
    });

    // 5. Extract citations like [Page 3]
    const pageMatches = fullAssistantResponse.match(/\[Page\s*(\d+)\]/gi) || [];
    const uniqueCitations = [
      ...new Set(
        pageMatches.map((m) => {
          const num = m.match(/\d+/)[0];
          return `Page ${num}`;
        })
      ),
    ];

    // 6. Save assistant response to DB
    const [savedAssistantMsg] = await sql`
      INSERT INTO pdf_messages (file_id, role, content, citations)
      VALUES (${fileId}, 'model', ${fullAssistantResponse}, ${JSON.stringify(uniqueCitations)})
      RETURNING id
    `;

    // 7. Send completion event
    res.write(
      `data: ${JSON.stringify({
        type: "done",
        messageId: savedAssistantMsg.id,
        citations: uniqueCitations,
      })}\n\n`
    );
    res.end();
  } catch (err) {
    console.error("PDF query error:", err);
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: `⚠️ Error: ${err.message || "Failed to generate answer."}`,
      })}\n\n`
    );
    res.end();
  }
};
