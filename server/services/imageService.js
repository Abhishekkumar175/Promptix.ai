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

/**
 * Intelligently synthesize the user's prompt and requested style into an accurate,
 * highly focused visual description for FLUX.1.
 * This avoids comma-soup buzzwords that dilute key user details like reflections or specific objects.
 */
export async function synthesizeVisualPrompt(userPrompt, style = "Cinematic") {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: "gemini-3.5-flash" });

    const systemInstruction = `You are an expert prompt engineer for FLUX.1 (Black Forest Labs flow transformer).
FLUX.1 excels at natural language descriptive sentences and literal prompt adherence.
Your mission:
1. Preserve every specific detail the user requested (e.g. reflections in visors, exact colors, positions, actions, expressions). Do NOT omit or override what the user asked for.
2. Integrate the visual aesthetic of the requested style '${style}' naturally into the lighting, composition, and mood (e.g. cinematic 35mm lighting, hyperrealistic textures, vibrant anime lines, 3D CGI render).
3. Do NOT output comma-separated buzzwords (like 'octane render, trending on artstation, unreal engine 5'). Write a single, focused, highly vivid descriptive visual paragraph (under 45 words).
4. Return ONLY the final prompt text. No quotes, intros, or conversational filler.`;

    const result = await model.generateContent([
      systemInstruction,
      `User prompt: "${userPrompt}"`,
    ]);

    const synthesized = result.response.text().trim().replace(/^["']|["']$/g, "");
    return synthesized || userPrompt;
  } catch (err) {
    console.warn("Prompt synthesis fallback:", err.message);
    return `${userPrompt.trim()}, in ${style} aesthetic`;
  }
}

/**
 * Expand a simple prompt into an expert Midjourney/FLUX prompt when user clicks "Magic Enhance".
 */
export async function enhancePromptWithGemini(userPrompt, style = "Cinematic") {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: "gemini-3.5-flash" });

    const systemInstruction = `You are an elite creative art director for FLUX.1 and Midjourney v6.
Transform the user's idea into an ultra-vivid, cinematic, and descriptive image prompt.
Focus on:
- Subject physical appearance, posture, and materials
- Dramatic lighting (rim light, volumetric rays, reflections, shadows)
- Background depth, atmosphere, and color grading matching '${style}' style
- Keep it under 60 words in natural flowing visual English. No conversational filler or buzzwords.
Return ONLY the prompt text.`;

    const result = await model.generateContent([
      systemInstruction,
      `User prompt: "${userPrompt}"`,
    ]);

    return result.response.text().trim().replace(/^["']|["']$/g, "");
  } catch (err) {
    console.warn("Prompt enhancement failed, using original prompt:", err.message);
    return userPrompt;
  }
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

  // Build URL with nologo and nofeed
  let queryParams = `width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&nologo=true&nofeed=true&model=flux`;

  // If a registered key exists in .env, pass it to guarantee zero watermark
  if (process.env.POLLINATIONS_API_KEY) {
    queryParams += `&key=${encodeURIComponent(process.env.POLLINATIONS_API_KEY)}`;
  }

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${queryParams}`;

  // Pre-warm generation
  try {
    await fetch(imageUrl, { method: "GET" });
  } catch (err) {
    console.warn("Pre-warm fetch notice:", err.message);
  }

  return { imageUrl, finalPrompt, width: dimensions.width, height: dimensions.height };
}
