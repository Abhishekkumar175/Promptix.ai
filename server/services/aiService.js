import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// We can seamlessly switch out models here.
// google/gemini-2.0-flash-lite-preview-02-05:free
// Using OpenRouter's auto-routing free endpoint to ensure the model never 404s
const DEFAULT_MODEL = "openrouter/free";

/**
 * Stream a chat conversation. Calls onChunk for each token.
 * @param {Array} history - [{role, content}]
 * @param {string} userMessage
 * @param {Function} onChunk - called with each streamed text chunk
 * @param {string} systemOverride - optional system instruction override
 */
export async function streamChat({ history, userMessage, onChunk, systemOverride }) {
  const systemText = systemOverride || `You are Promptix AI, an intelligent and helpful assistant. 
You help users with coding, writing, analysis, brainstorming, and any other tasks.
Be concise but thorough. Use markdown formatting when appropriate.
If asked what you are, say you are Promptix AI powered by advanced language models.`;

  // Build the message array in standard OpenAI format
  const messages = [
    { role: "system", content: systemText },
    ...history,
    { role: "user", content: userMessage }
  ];

  const stream = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 4096,
  });

  let fullText = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }
  return fullText;
}

/**
 * Convert DB messages to standard OpenAI format
 * DB messages: [{role: 'user'|'model', content: '...'}]
 */
export function toAIHistory(messages) {
  return messages.map((m) => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.content,
  }));
}

// Export the singleton instance for controllers that need raw access (like resumeController)
export { openai, DEFAULT_MODEL };
