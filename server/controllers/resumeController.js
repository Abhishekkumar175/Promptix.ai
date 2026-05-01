import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";
import { openai, DEFAULT_MODEL } from "../services/aiService.js";
import sql from "../configs/db.js";

// Multi-pass resume analysis with AI
export const analyzeResume = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { originalname, mimetype, buffer } = req.file;
    const { jobDescription = "" } = req.body;

    // 1. Extract text
    let resumeText = "";
    if (mimetype === "application/pdf") {
      const data = await pdfParse(buffer);
      resumeText = data.text;
    } else {
      const { value } = await mammoth.extractRawText({ buffer });
      resumeText = value;
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ success: false, message: "Could not extract text from the uploaded file." });
    }

    // Trim to avoid token limits
    const trimmedResume = resumeText.slice(0, 8000);

    const getCompletion = async (prompt) => {
      const res = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      return res.choices[0].message.content;
    };

    // 2. Multi-pass analysis (3 focused prompts run in parallel)
    const [atsResult, contentResult, impactResult] = await Promise.all([

      // Pass 1: ATS Score + Keywords
      getCompletion(`Analyze this resume for ATS (Applicant Tracking System) compatibility.
${jobDescription ? `Job Description to match against:\n${jobDescription}\n` : "Perform a general ATS analysis."}

Resume:
${trimmedResume}

Respond ONLY with this exact JSON (no markdown, no explanation):
{
  "atsScore": <number 0-100>,
  "matchedKeywords": [<string>, ...],
  "missingKeywords": [<string>, ...],
  "atsVerdict": "<string: one sentence summary>"
}`),

      // Pass 2: Section Quality
      getCompletion(`Analyze the quality of each section of this resume.

Resume:
${trimmedResume}

Respond ONLY with this exact JSON (no markdown):
{
  "summary": { "score": <0-10>, "feedback": "<string>", "suggestion": "<string>" },
  "experience": { "score": <0-10>, "feedback": "<string>", "suggestion": "<string>" },
  "skills": { "score": <0-10>, "feedback": "<string>", "suggestion": "<string>" },
  "education": { "score": <0-10>, "feedback": "<string>" }
}`),

      // Pass 3: Impact & Formatting
      getCompletion(`Analyze this resume for impact, formatting, and overall quality.

Resume:
${trimmedResume}

Respond ONLY with this exact JSON (no markdown):
{
  "overallScore": <number 0-100>,
  "grade": "<A+|A|B+|B|C+|C|D>",
  "strengths": [<string>, <string>, <string>],
  "improvements": [<string>, <string>, <string>],
  "nextSteps": [<string>, <string>],
  "lengthAssessment": "<too short|optimal|too long>",
  "toneAssessment": "<professional|semi-professional|needs work>"
}`)
    ]);

    // 3. Parse all responses safely
    const parseJSON = (textResult) => {
      try {
        const text = textResult.replace(/```json|```/g, "").trim();
        return JSON.parse(text);
      } catch {
        return {};
      }
    };

    const ats = parseJSON(atsResult);
    const content = parseJSON(contentResult);
    const impact = parseJSON(impactResult);

    const analysis = { ats, content, impact, fileName: originalname };

    // 4. Save to DB
    await sql`
      INSERT INTO resume_reviews (user_id, file_name, ats_score, analysis)
      VALUES (${userId}, ${originalname}, ${ats.atsScore || 0}, ${JSON.stringify(analysis)})
    `;

    res.json({ success: true, analysis });

  } catch (err) {
    console.error("Resume analysis error:", err);
    const isRateLimit = err.message?.includes("Too Many Requests") || err.message?.includes("RESOURCE_EXHAUSTED");
    res.status(isRateLimit ? 429 : 500).json({
      success: false,
      message: isRateLimit
        ? "AI is temporarily busy. Please wait a moment and try again."
        : err.message
    });
  }
};

// GET /api/resume/history — list user's past reviews
export const getResumeHistory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const reviews = await sql`
      SELECT id, file_name, ats_score, created_at
      FROM resume_reviews
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
