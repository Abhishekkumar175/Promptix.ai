import { GoogleGenerativeAI } from "@google/generative-ai";
import { clerkClient } from "@clerk/express";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔥 TEMP TEST CODE
(async () => {
  try {
    const models = await genAI.listModels();
    console.log("Available Models:");
    models.models.forEach((m) => console.log(m.name));
  } catch (err) {
    console.error("Model list error:", err);
  }
})();

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;

    if (!prompt || !length) {
      return res.status(400).json({
        success: false,
        message: "Topic and length required",
      });
    }

    if (req.plan !== "premium" && req.free_usage >= 50) {
      return res.json({
        success: false,
        message: "Free usage limit reached",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro",
    });

    const result = await model.generateContent(
      `Write a ${length} word article about: ${prompt}`
    );

    const response = await result.response;
    const text = response.text();

    // Increase free usage
    if (req.plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: req.free_usage + 1,
        },
      });
    }

    res.json({
      success: true,
      article: text,
    });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
