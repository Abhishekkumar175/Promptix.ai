import sql from "../configs/db.js";
import {
  generateFluxImage,
  enhancePromptWithGemini,
} from "../services/imageService.js";

// ── POST /api/image/generate ──
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, style = "Cinematic", ratio = "1:1", enhance = false } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }

    let enhancedPrompt = null;
    let promptToRender = prompt.trim();

    // If user clicked or requested Magic Enhance
    if (enhance) {
      enhancedPrompt = await enhancePromptWithGemini(prompt, style);
      promptToRender = enhancedPrompt;
    }

    // Generate with FLUX.1
    const { imageUrl } = await generateFluxImage({
      prompt: promptToRender,
      style,
      ratio,
    });

    // Save to Neon DB
    const [savedRecord] = await sql`
      INSERT INTO generated_images (
        user_id, prompt, enhanced_prompt, style, aspect_ratio, image_url
      )
      VALUES (
        ${userId}, ${prompt.trim()}, ${enhancedPrompt}, ${style}, ${ratio}, ${imageUrl}
      )
      RETURNING *
    `;

    res.json({
      success: true,
      image: savedRecord,
    });
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to generate image.",
    });
  }
};

// ── POST /api/image/enhance-prompt ──
export const enhancePrompt = async (req, res) => {
  try {
    const { prompt, style = "Cinematic" } = req.body;
    if (!prompt?.trim()) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }

    const enhanced = await enhancePromptWithGemini(prompt, style);
    res.json({
      success: true,
      enhancedPrompt: enhanced,
    });
  } catch (err) {
    console.error("Prompt enhance error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to enhance prompt.",
    });
  }
};

// ── GET /api/image/history ──
export const getUserImages = async (req, res) => {
  try {
    const { userId } = req.auth();

    const images = await sql`
      SELECT id, prompt, enhanced_prompt, style, aspect_ratio, image_url, created_at
      FROM generated_images
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 60
    `;

    res.json({ success: true, images });
  } catch (err) {
    console.error("Get image history error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/image/:id ──
export const deleteImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    await sql`
      DELETE FROM generated_images
      WHERE id = ${id} AND user_id = ${userId}
    `;

    res.json({ success: true, message: "Image removed from history." });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
