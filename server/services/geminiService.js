import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

function getGenAI() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in server environment.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Preferred models with fallback
export const PRIMARY_MODEL = "gemini-3.5-flash";
export const FALLBACK_MODEL = "gemini-flash-latest";

/**
 * Stream a general chat conversation with Gemini.
 */
export async function streamChat({ history, userMessage, onChunk, systemOverride }) {
  const ai = getGenAI();
  const systemText =
    systemOverride ||
    `You are Promptix AI, an intelligent and helpful assistant.
You help users with coding, writing, analysis, brainstorming, and any other tasks.
Be concise but thorough. Use markdown formatting when appropriate.
If asked what you are, say you are Promptix AI powered by advanced language models.`;

  async function execute(modelName) {
    const model = ai.getGenerativeModel({
      model: modelName,
      systemInstruction: systemText,
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    });

    const chat = model.startChat({
      history: history || [],
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

  try {
    return await execute(PRIMARY_MODEL);
  } catch (err) {
    console.warn(`Gemini primary model ${PRIMARY_MODEL} failed, using fallback:`, err.message);
    return await execute(FALLBACK_MODEL);
  }
}

/**
 * Stream Q&A about a document using Gemini's native long-context window.
 */
export async function streamDocumentChat({
  fileName,
  documentText,
  history = [],
  userQuestion,
  onChunk,
}) {
  const ai = getGenAI();

  const systemInstruction = `You are Promptix AI, an elite document intelligence and research assistant.
You are analyzing the document titled: "${fileName}".

CRITICAL INSTRUCTIONS:
1. Grounding: Answer the user's questions accurately based on the provided document content.
2. Page Citations: Whenever you reference or quote facts, figures, or findings from the document, explicitly cite the page number using the format [Page X] (e.g. [Page 1], [Page 4]).
3. Formatting: Use rich, clear Markdown formatting. Use bolding for key terms, bullet points for lists, and tables for comparative data.
4. Completeness: If asked for a summary, provide a comprehensive, well-structured executive summary covering main points, methodology, and key takeaways.
5. Honesty: If the question cannot be answered from the document, clearly state that the document does not contain this information, but provide any relevant context if available.
6. Follow-up Suggestions: At the very end of your response, suggest exactly 2 or 3 insightful, concise follow-up questions that the user might want to explore next based on this document and your answer. Format them strictly at the end preceded by "===FOLLOW_UPS===" on its own line, like this:
===FOLLOW_UPS===
- First follow-up question?
- Second follow-up question?
- Third follow-up question?

=== DOCUMENT CONTENT START ===
${documentText}
=== DOCUMENT CONTENT END ===`;

  // Format past history for Gemini SDK
  const formattedHistory = (history || []).map((msg) => ({
    role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  async function execute(modelName) {
    const model = ai.getGenerativeModel({
      model: modelName,
      systemInstruction,
      generationConfig: {
        temperature: 0.2, // Low temperature for high fidelity grounding
        maxOutputTokens: 4096,
      },
    });

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessageStream(userQuestion);
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

  try {
    return await execute(PRIMARY_MODEL);
  } catch (err) {
    console.warn(`Document chat primary model ${PRIMARY_MODEL} failed, trying fallback:`, err.message);
    return await execute(FALLBACK_MODEL);
  }
}

/**
 * Convert DB messages to Gemini history format
 * DB messages: [{role: 'user'|'model', content: '...'}]
 */
export function toGeminiHistory(messages) {
  return (messages || []).map((m) => ({
    role: m.role === "assistant" || m.role === "model" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}
