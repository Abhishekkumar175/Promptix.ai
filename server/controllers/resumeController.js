import { extractResumeText, analyzeResumeContent } from "../services/resumeService.js";
import sql from "../configs/db.js";

/**
 * POST /api/resume/analyze
 * Single-pass deep ATS & impact resume analysis
 */
export const analyzeResume = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No resume file uploaded." });
    }

    const { originalname, mimetype, buffer } = req.file;
    const { jobDescription = "" } = req.body;

    // 1. Extract text from PDF or DOCX
    const resumeText = await extractResumeText(buffer, mimetype);

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        success: false,
        message: "Could not extract readable text from the uploaded file. Please ensure it is not an image scan.",
      });
    }

    // 2. Perform deep AI analysis
    const analysisData = await analyzeResumeContent(resumeText, jobDescription);
    const analysis = {
      ...analysisData,
      fileName: originalname,
      analyzedAt: new Date().toISOString(),
    };

    // 3. Persist to Neon Postgres
    const [inserted] = await sql`
      INSERT INTO resume_reviews (user_id, file_name, ats_score, analysis)
      VALUES (${userId}, ${originalname}, ${analysis.atsScore || 0}, ${JSON.stringify(analysis)})
      RETURNING id, file_name, ats_score, created_at
    `;

    res.json({
      success: true,
      analysis: {
        ...analysis,
        id: inserted?.id,
      },
    });
  } catch (err) {
    console.error("Resume analysis controller error:", err);
    const isRateLimit = err.message?.includes("Too Many Requests") || err.message?.includes("429");
    res.status(isRateLimit ? 429 : 500).json({
      success: false,
      message: isRateLimit
        ? "AI review queue is momentarily busy. Please try again in a few seconds."
        : err.message || "Failed to analyze resume.",
    });
  }
};

/**
 * GET /api/resume/history
 * List user's past resume reviews
 */
export const getResumeHistory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const reviews = await sql`
      SELECT id, file_name, ats_score, analysis, created_at
      FROM resume_reviews
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 15
    `;
    res.json({ success: true, reviews });
  } catch (err) {
    console.error("Get resume history error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/resume/history/:id
 * Retrieve a specific past resume review
 */
export const getResumeReviewById = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    const [review] = await sql`
      SELECT id, file_name, ats_score, analysis, created_at
      FROM resume_reviews
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, review });
  } catch (err) {
    console.error("Get review by id error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/resume/history/:id
 * Delete a past resume review
 */
export const deleteResumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    await sql`
      DELETE FROM resume_reviews
      WHERE id = ${id} AND user_id = ${userId}
    `;

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
