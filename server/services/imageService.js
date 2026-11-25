import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
function getGenAI() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

export const RATIO_MAP = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
};

const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

/**
 * Robust call to Gemini with model fallback if one hits 503
 */
async function callGemini(systemInstruction, userContent) {
  const ai = getGenAI();
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([systemInstruction, userContent]);
      const text = result.response.text().trim().replace(/^["']|["']$/g, "");
      if (text) return text;
    } catch (err) {
      console.warn(`Model ${modelName} call notice:`, err.message);
    }
  }
  return null;
}

/**
 * Intelligently synthesize the user's prompt and requested style into an accurate,
 * highly focused visual description for FLUX.1.
 */
export async function synthesizeVisualPrompt(userPrompt, style = "Cinematic") {
  const systemInstruction = `You are an elite prompt engineer for the FLUX.1 image generation model.
Your task is to take the user's prompt and refine it so FLUX.1 achieves 100% prompt accuracy.
Rules:
1. Grounding: If the user asks for reflections (e.g. Earth in visor), specific objects, colors, or poses, make sure that detail is described explicitly and vividly.
2. Aesthetic: Blend the requested aesthetic '${style}' seamlessly into the lighting, camera lens, and color grading.
3. Natural Language: Write ONE flowing, highly descriptive visual sentence (under 45 words). Do NOT dump comma-separated tags or buzzwords like 'octane render, trending on artstation'.
4. Return ONLY the final prompt text. No quotes, intro, or conversation.`;

  const synthesized = await callGemini(systemInstruction, `User Prompt: "${userPrompt}"`);
  return synthesized || `${userPrompt.trim()}, ${style.toLowerCase()} photography`;
}

/**
 * Expand a simple prompt into an expert Midjourney/FLUX prompt when user clicks "Magic Enhance".
 */
export async function enhancePromptWithGemini(userPrompt, style = "Cinematic") {
  const systemInstruction = `You are a creative art director for FLUX.1.
Transform this brief prompt into an ultra-vivid, cinematic, and descriptive image prompt.
Focus on:
- Subject physical appearance, posture, and materials
- Lighting (rim light, volumetric rays, reflections, shadows)
- Background depth, atmosphere, and color grading matching '${style}' style
- Keep it under 60 words in natural flowing visual English.
Return ONLY the prompt text.`;

  const enhanced = await callGemini(systemInstruction, `User prompt: "${userPrompt}"`);
  return enhanced || userPrompt;
}

/**
 * Generate image using FLUX.1 model.
 */
export async function generateFluxImage({ prompt, style = "Cinematic", ratio = "1:1" }) {
  const dimensions = RATIO_MAP[ratio] || RATIO_MAP["1:1"];

  // Intelligently synthesize prompt with style so key user details are never diluted
  const finalPrompt = await synthesizeVisualPrompt(prompt, style);
  const seed = Math.floor(Math.random() * 100000000);

  const encodedPrompt = encodeURIComponent(finalPrompt);

  // Pollinations generation parameters
  const queryParams = `width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&nologo=true&nofeed=true&model=flux`;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${queryParams}`;

  // Pre-warm generation
  try {
    await fetch(imageUrl, { method: "GET" });
  } catch (err) {
    console.warn("Pre-warm notice:", err.message);
  }

  return { imageUrl, finalPrompt, width: dimensions.width, height: dimensions.height };
}
