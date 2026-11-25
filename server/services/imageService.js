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

export const STYLE_MAP = {
  Cinematic: "cinematic lighting, dramatic composition, 35mm film photograph, highly detailed, photorealistic, 8k, bokeh",
  Realistic: "photorealistic, hyperrealistic, high resolution photograph, 8k uhd, soft natural lighting, high dynamic range, sharp focus",
  Anime: "anime artwork, Makoto Shinkai aesthetic, vibrant colors, detailed line art, masterpiece, studio ghibli inspired",
  "3D Render": "octane render, 3D digital art, trending on artstation, raytracing, unreal engine 5, volumetric lighting, smooth surfaces",
  Cyberpunk: "cyberpunk aesthetic, glowing neon lights, holographic reflections, futuristic sci-fi details, dark moody night, rain reflections",
  Fantasy: "epic fantasy art, mythical atmosphere, magical glow, highly detailed digital painting, artstation, grand fantasy landscape",
  "Oil Painting": "classic oil painting, visible canvas texture and impasto brush strokes, fine art masterpiece, Rembrandt lighting, rich oil colors",
  Minimalist: "minimalist aesthetic, clean lines, elegant composition, muted colors, negative space, modern sophisticated design",
};

export const RATIO_MAP = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
};

/**
 * Expand a simple prompt into an expert Midjourney/FLUX prompt using Gemini 3.5 Flash.
 */
export async function enhancePromptWithGemini(userPrompt, style = "Cinematic") {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: "gemini-3.5-flash" });

    const systemInstruction = `You are an expert prompt engineer for state-of-the-art AI image generators (FLUX.1 and Midjourney).
Your job is to transform the user's brief prompt into a visually rich, breathtaking, and detailed image prompt.
Rules:
- Describe the subject with vivid visual details (clothing, expression, texture, material).
- Add rich environmental context (atmosphere, mood, background depth).
- Specify lighting and color palette (e.g. golden hour volumetric light, soft natural diffused glow, neon rim lighting).
- Align with the requested aesthetic: ${style}.
- Keep it concise (under 60-70 words).
- Return ONLY the enhanced prompt text, without any quotes, intros, or conversational filler.`;

    const result = await model.generateContent([
      systemInstruction,
      `User idea: ${userPrompt}`,
    ]);

    const text = result.response.text().trim();
    // Strip accidental quotes if any
    return text.replace(/^["']|["']$/g, "").trim();
  } catch (err) {
    console.warn("Prompt enhancement failed, using original prompt:", err.message);
    return userPrompt;
  }
}

/**
 * Generate image using FLUX.1 model via Pollinations.
 */
export async function generateFluxImage({ prompt, style = "Cinematic", ratio = "1:1" }) {
  const dimensions = RATIO_MAP[ratio] || RATIO_MAP["1:1"];
  const styleKeywords = STYLE_MAP[style] || STYLE_MAP["Cinematic"];

  // Combine prompt with style keywords
  const finalPrompt = `${prompt.trim()}, ${styleKeywords}`;
  const seed = Math.floor(Math.random() * 100000000);

  const encodedPrompt = encodeURIComponent(finalPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&nologo=true&model=flux`;

  // Pre-warm / trigger image generation
  try {
    await fetch(imageUrl, { method: "GET" });
  } catch (err) {
    console.warn("Pre-warm fetch notice:", err.message);
  }

  return { imageUrl, finalPrompt, width: dimensions.width, height: dimensions.height };
}
