import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-2.0-flash — standard for new exp keys
const getModel = () =>
  genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Stream a chat conversation. Calls onChunk for each token.
 * @param {Array} history - [{role, parts:[{text}]}]
 * @param {string} userMessage
 * @param {Function} onChunk - called with each streamed text chunk
 * @param {string} systemOverride - optional system instruction override
 */
export async function streamChat({ history, userMessage, onChunk, systemOverride }) {
  const model = getModel();

  const systemText = systemOverride || `You are Promptix AI, an intelligent and helpful assistant. 
You help users with coding, writing, analysis, brainstorming, and any other tasks.
Be concise but thorough. Use markdown formatting when appropriate.
If asked what you are, say you are Promptix AI powered by advanced language models.`;

  // Start chat session with history (Gemini format)
  const chat = model.startChat({
    history,
    generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    systemInstruction: {
      parts: [{ text: systemText }]
    }
  });

  const result = await chat.sendMessageStream(userMessage);

  let fullText = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }
  return fullText;
}

/**
 * Convert DB messages to Gemini history format
 * DB messages: [{role: 'user'|'model', content: '...'}]
 */
export function toGeminiHistory(messages) {
  return messages.map((m) => ({
    role: m.role, // 'user' or 'model'
    parts: [{ text: m.content }],
  }));
}
