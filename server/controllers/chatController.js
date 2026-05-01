import sql from "../configs/db.js";
import { streamChat, toAIHistory } from "../services/aiService.js";

// ─── GET /api/chat/threads ─── List user's chat threads
export const getThreads = async (req, res) => {
  try {
    const { userId } = req.auth();
    const threads = await sql`
      SELECT id, title, model, created_at, updated_at
      FROM chat_threads
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 50
    `;
    res.json({ success: true, threads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/chat/threads ─── Create new thread
export const createThread = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { title = "New Chat" } = req.body;

    const [thread] = await sql`
      INSERT INTO chat_threads (user_id, title)
      VALUES (${userId}, ${title})
      RETURNING *
    `;
    res.json({ success: true, thread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/chat/threads/:threadId/messages ─── Get messages in a thread
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { threadId } = req.params;

    // Verify thread belongs to user
    const [thread] = await sql`
      SELECT id FROM chat_threads WHERE id = ${threadId} AND user_id = ${userId}
    `;
    if (!thread) return res.status(404).json({ success: false, message: "Thread not found" });

    const messages = await sql`
      SELECT id, role, content, created_at
      FROM chat_messages
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC
    `;
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/chat/threads/:threadId ─── Delete a thread
export const deleteThread = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { threadId } = req.params;

    await sql`
      DELETE FROM chat_threads WHERE id = ${threadId} AND user_id = ${userId}
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/chat/threads/:threadId/stream ─── Stream a chat response (SSE)
export const streamMessage = async (req, res) => {
  const { userId } = req.auth();
  const { threadId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  // Verify thread ownership
  const [thread] = await sql`
    SELECT id FROM chat_threads WHERE id = ${threadId} AND user_id = ${userId}
  `;
  if (!thread) return res.status(404).json({ success: false, message: "Thread not found" });

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  try {
    // Save user message to DB
    await sql`
      INSERT INTO chat_messages (thread_id, role, content)
      VALUES (${threadId}, 'user', ${message})
    `;

    // Load conversation history (last 20 messages for context window)
    const history = await sql`
      SELECT role, content FROM chat_messages
      WHERE thread_id = ${threadId} AND role != 'user' OR (role = 'user' AND content != ${message})
      ORDER BY created_at ASC
      LIMIT 20
    `;
    // All messages except the one just inserted (Gemini handles it as sendMessage)
    const prevMessages = await sql`
      SELECT role, content FROM chat_messages
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC
      OFFSET 0 LIMIT (
        SELECT COUNT(*) - 1 FROM chat_messages WHERE thread_id = ${threadId}
      )
    `;

    const aiHistory = toAIHistory(prevMessages);
    let fullResponse = "";

    // Stream response from Gemini
    await streamChat({
      history: aiHistory,
      userMessage: message,
      onChunk: (text) => {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ type: "token", content: text })}\n\n`);
      },
    });

    // Save assistant response to DB
    await sql`
      INSERT INTO chat_messages (thread_id, role, content)
      VALUES (${threadId}, 'model', ${fullResponse})
    `;

    // Update thread timestamp and auto-title on first message
    if (prevMessages.length === 0) {
      const shortTitle = message.slice(0, 60) + (message.length > 60 ? "..." : "");
      await sql`
        UPDATE chat_threads SET title = ${shortTitle}, updated_at = NOW() WHERE id = ${threadId}
      `;
    } else {
      await sql`UPDATE chat_threads SET updated_at = NOW() WHERE id = ${threadId}`;
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();

  } catch (err) {
    console.error("Stream error:", err);
    // Detect rate limit / quota errors
    const isRateLimit = err.message?.includes("Too Many Requests") || err.message?.includes("RESOURCE_EXHAUSTED") || err.status === 429;
    const userMessage = isRateLimit
      ? "⚠️ The AI is temporarily busy (rate limit). Please wait a moment and try again."
      : `⚠️ Something went wrong: ${err.message?.slice(0, 100) || "Unknown error"}`;
    res.write(`data: ${JSON.stringify({ type: "error", message: userMessage })}\n\n`);
    res.end();
  }
};
