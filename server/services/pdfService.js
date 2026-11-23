import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";
import sql from "../configs/db.js";

/**
 * Custom page render function for pdf-parse to inject [Page X] headers.
 */
function renderPage(pageData) {
  return pageData.getTextContent().then((textContent) => {
    let lastY, text = "";
    for (const item of textContent.items) {
      if (lastY === item.transform[5] || !lastY) {
        text += item.str;
      } else {
        text += "\n" + item.str;
      }
      lastY = item.transform[5];
    }
    const pageNum = pageData.pageIndex + 1;
    return `\n--- [Page ${pageNum}] ---\n` + text;
  });
}

/**
 * Extract raw text from buffer with page numbers.
 * Supports PDF, DOCX, and TXT.
 */
export async function extractText(buffer, mimeType) {
  if (mimeType === "application/pdf") {
    try {
      const data = await pdfParse(buffer, { pagerender: renderPage });
      return { text: data.text, pageCount: data.numpages || 1 };
    } catch {
      // Fallback to standard parsing if custom pagerender fails on any unusual PDF format
      const fallbackData = await pdfParse(buffer);
      return { text: fallbackData.text, pageCount: fallbackData.numpages || 1 };
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return { text: `--- [Page 1] ---\n` + value, pageCount: 1 };
  }

  // Plain text / Markdown
  return { text: `--- [Page 1] ---\n` + buffer.toString("utf-8"), pageCount: 1 };
}

/**
 * Process a PDF/DOCX file:
 * 1. Extract text with page markers
 * 2. Store full text and page count in DB
 * 3. Update status to 'ready'
 */
export async function processDocument({ fileId, buffer, mimeType }) {
  try {
    const { text, pageCount } = await extractText(buffer, mimeType);

    await sql`
      UPDATE pdf_files
      SET status = 'ready', 
          page_count = ${pageCount}, 
          full_text = ${text},
          updated_at = NOW()
      WHERE id = ${fileId}
    `;

    return { pageCount };
  } catch (err) {
    console.error(`✗ Error processing document ID ${fileId}:`, err);
    await sql`
      UPDATE pdf_files
      SET status = 'failed',
          updated_at = NOW()
      WHERE id = ${fileId}
    `;
    throw err;
  }
}
