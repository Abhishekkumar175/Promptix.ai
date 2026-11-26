import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";
import OpenAI from "openai";

let openaiClient = null;
function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return openaiClient;
}

const RESUME_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

/**
 * Deterministically detect contact info from raw resume text
 */
export function auditContactInfo(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const githubRegex = /github\.com\/[a-zA-Z0-9_-]+/i;

  return {
    email: emailRegex.test(text),
    phone: phoneRegex.test(text),
    linkedin: linkedinRegex.test(text),
    githubOrPortfolio: githubRegex.test(text) || /portfolio|gitlab|behance|medium\.com/i.test(text),
    location: /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/.test(text),
  };
}

/**
 * Extract raw text from PDF or DOCX buffer
 */
export async function extractResumeText(buffer, mimetype) {
  let text = "";
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    text = data.text;
  } else {
    const { value } = await mammoth.extractRawText({ buffer });
    text = value;
  }
  return text?.trim() || "";
}

/**
 * Execute unified comprehensive resume analysis with AI
 */
export async function analyzeResumeContent(resumeText, jobDescription = "") {
  // Pre-audit deterministic contacts
  const contactDetections = auditContactInfo(resumeText);

  const prompt = `You are an elite Fortune 500 Executive Recruiter, Senior Talent Acquisition Lead, and ATS (Applicant Tracking System) Algorithm Specialist.

Conduct an exhaustive, deep-dive analysis of the following candidate resume.
${jobDescription ? `TARGET JOB DESCRIPTION TO MATCH AGAINST:\n"""${jobDescription.slice(0, 4000)}"""\n` : "Perform a general high-standards ATS and impact analysis."}

CANDIDATE RESUME:
"""
${resumeText.slice(0, 16000)}
"""

You MUST respond with a single, strictly valid JSON object matching this exact schema. Do not include markdown codeblocks or explanations outside the JSON:

{
  "atsScore": <number 0-100>,
  "grade": "<A+|A|B+|B|C+|C|D>",
  "atsVerdict": "<string: one crisp, executive summary sentence of the resume's competitiveness>",
  "pillars": {
    "parseability": {
      "score": <number 0-100>,
      "feedback": "<string: evaluation of layout, standard headers, font clarity, absence of tables/graphics that break ATS>"
    },
    "quantifiableImpact": {
      "score": <number 0-100>,
      "feedback": "<string: evaluation of measurable business outcomes, numbers, metrics, %, or $ in bullet points>",
      "metricsRatio": "<string: estimated ratio, e.g. '3 of 12 bullets have metrics'>"
    },
    "keywordMatch": {
      "score": <number 0-100>,
      "feedback": "<string: alignment of industry standard technical and domain keywords>"
    },
    "structureAndTone": {
      "score": <number 0-100>,
      "feedback": "<string: evaluation of length, reverse-chronological order, active verbs, and tone>"
    }
  },
  "contactAudit": {
    "email": ${contactDetections.email},
    "phone": ${contactDetections.phone},
    "linkedin": ${contactDetections.linkedin},
    "githubOrPortfolio": ${contactDetections.githubOrPortfolio},
    "location": ${contactDetections.location},
    "feedback": "<string: recommendation about missing contact details or links>"
  },
  "keywords": {
    "matchRate": <number 0-100>,
    "matched": [<string: top 6-10 keywords present in resume>],
    "missing": [<string: top 6-10 crucial industry or JD keywords missing from resume>]
  },
  "sections": {
    "summary": {
      "score": <number 0-10>,
      "status": "<Good|Needs Improvement|Missing>",
      "feedback": "<string>",
      "suggestion": "<string>"
    },
    "experience": {
      "score": <number 0-10>,
      "status": "<Good|Needs Improvement|Missing>",
      "feedback": "<string>",
      "suggestion": "<string>"
    },
    "skills": {
      "score": <number 0-10>,
      "status": "<Good|Needs Improvement|Missing>",
      "feedback": "<string>",
      "suggestion": "<string>"
    },
    "projects": {
      "score": <number 0-10>,
      "status": "<Good|Needs Improvement|Missing>",
      "feedback": "<string>",
      "suggestion": "<string>"
    },
    "education": {
      "score": <number 0-10>,
      "status": "<Good|Needs Improvement|Missing>",
      "feedback": "<string>",
      "suggestion": "<string>"
    }
  },
  "bulletPointFixes": [
    {
      "original": "<string: exact or representative weak bullet point from the candidate resume>",
      "improved": "<string: high-impact rewrite applying Google's XYZ formula: Accomplished [X] as measured by [Y], by doing [Z]>",
      "reason": "<string: explanation of why the improved version passes recruiter screens>"
    },
    {
      "original": "<string: second weak bullet point>",
      "improved": "<string: high-impact rewrite>",
      "reason": "<string>"
    },
    {
      "original": "<string: third weak bullet point>",
      "improved": "<string: high-impact rewrite>",
      "reason": "<string>"
    }
  ],
  "strengths": [
    "<string: specific strength 1>",
    "<string: specific strength 2>",
    "<string: specific strength 3>"
  ],
  "criticalImprovements": [
    "<string: high priority actionable fix 1>",
    "<string: high priority actionable fix 2>",
    "<string: high priority actionable fix 3>"
  ]
}`;

  let lastError = null;

  for (const model of RESUME_MODELS) {
    try {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const rawContent = response.choices[0]?.message?.content?.trim();
      if (!rawContent) continue;

      const cleanJson = rawContent.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      // Sanitize fields with fallbacks
      parsed.atsScore = typeof parsed.atsScore === "number" ? Math.min(100, Math.max(0, parsed.atsScore)) : 72;
      parsed.grade = parsed.grade || (parsed.atsScore >= 85 ? "A" : parsed.atsScore >= 70 ? "B" : "C");
      parsed.bulletPointFixes = Array.isArray(parsed.bulletPointFixes) ? parsed.bulletPointFixes : [];
      parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
      parsed.criticalImprovements = Array.isArray(parsed.criticalImprovements) ? parsed.criticalImprovements : [];

      return parsed;
    } catch (err) {
      console.warn(`Model ${model} analysis error:`, err.message);
      lastError = err;
    }
  }

  throw new Error(lastError?.message || "Failed to analyze resume. Please try again.");
}
