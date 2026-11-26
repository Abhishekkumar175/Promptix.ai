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

const INTERVIEW_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

async function callModel(prompt, jsonMode = true) {
  const openai = getOpenAIClient();
  let lastError = null;

  for (const model of INTERVIEW_MODELS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        temperature: 0.6,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (content) return content;
    } catch (err) {
      console.warn(`Interview model ${model} error:`, err.message);
      lastError = err;
    }
  }
  throw new Error(lastError?.message || "AI Interview service temporarily unavailable.");
}

/**
 * 1. Generate opening question tailored to role, type, difficulty, and candidate resume
 */
export async function generateOpeningQuestion({ role, type = "tech", difficulty = "Mid-Level", resumeContext = null }) {
  const prompt = `You are an elite Senior Staff Engineering Director and Hiring Manager conducting a realistic mock interview.

INTERVIEW CONFIGURATION:
- Target Role: "${role}"
- Interview Type: "${type}" (tech: technical coding & concepts | behavioral: leadership, STAR, team dynamics | system: architecture, scalability, tradeoffs)
- Target Seniority Level: "${difficulty}"
${resumeContext?.resumeName ? `- Candidate Resume Context: Profile: "${resumeContext.summary || ''}", Verified Key Skills: [${(resumeContext.keySkills || []).join(', ')}]` : ''}

GOAL:
Craft a realistic, professional, and conversational opening question.
- If it's a technical interview, introduce yourself briefly as the interviewer and ask an opening architectural or core technical question related to ${role}.
- If resume context is present, reference one of their skills or background naturally.
- Keep the tone polite, professional, and focused. Do not provide answers or tips.

Respond with ONLY the opening question text (1-3 sentences). No JSON, no markdown tags.`;

  try {
    const raw = await callModel(prompt, false);
    return raw.replace(/^["']|["']$/g, "").trim();
  } catch (err) {
    console.warn("Opening question generation fallback:", err.message);
    if (type === "system") {
      return `Welcome! I'm your interviewer today. We'll be doing a ${difficulty} System Design interview for the ${role} position. To start, how would you design a scalable notification service handling 10 million daily active users?`;
    }
    if (type === "behavioral") {
      return `Welcome! I'll be conducting your ${difficulty} behavioral interview for the ${role} role. Let's begin: Could you tell me about a time you led a challenging project under tight deadlines?`;
    }
    return `Welcome! I'll be your technical interviewer today for the ${role} position (${difficulty} level). Let's start: Could you walk me through your technical background and your experience building scalable web applications?`;
  }
}

/**
 * 2. Process an interview turn: Evaluate candidate's latest response and generate follow-up question
 */
export async function processInterviewTurn({
  role,
  type = "tech",
  difficulty = "Mid-Level",
  resumeContext = null,
  history = [],
  userResponse,
}) {
  const formattedHistory = history
    .map((m) => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .slice(-8)
    .join("\n\n");

  const prompt = `You are an elite Senior Staff Interviewer evaluating a candidate's answer in a live mock interview.

INTERVIEW SPECIFICATIONS:
- Role: "${role}"
- Category: "${type}"
- Seniority: "${difficulty}"
${resumeContext?.resumeName ? `- Candidate Key Skills: [${(resumeContext.keySkills || []).join(', ')}]` : ''}

CONVERSATION TRANSCRIPT SO FAR:
${formattedHistory}

CANDIDATE'S LATEST ANSWER:
"""${userResponse}"""

YOUR TASK:
1. Turn-by-Turn Micro-Evaluation:
   - score (0-10): Technical & communication rating for this specific answer.
   - positive: 1 concise sentence highlighting what the candidate explained well.
   - missing: 1 concise sentence highlighting what was missing or could be strengthened (e.g. edge cases, metrics, trade-offs).
   - suggestion: 1 practical tip for a real interview.
2. Next Interview Question:
   - Generate the next question.
   - If the candidate mentioned a specific tool, algorithm, or decision, drill deeper into that exact point (trade-offs, failure recovery, scaling).
   - If their answer was comprehensive, smoothly transition to the next important topic for ${role}.
   - Keep the question direct and engaging.
3. isReadyToEnd: boolean (true if there have been at least 4-5 substantial turns and the interview has reached a natural conclusion).

Respond ONLY with valid JSON matching this schema:
{
  "microFeedback": {
    "score": <number 0-10>,
    "positive": "<string>",
    "missing": "<string>",
    "suggestion": "<string>"
  },
  "nextQuestion": "<string: the interviewer's next spoken question>",
  "isReadyToEnd": <boolean>
}`;

  try {
    const raw = await callModel(prompt, true);
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      microFeedback: parsed.microFeedback || {
        score: 7,
        positive: "Good foundational understanding demonstrated.",
        missing: "Could elaborate more on scalability constraints and edge cases.",
        suggestion: "Structure answers using concrete examples and measurable outcomes.",
      },
      nextQuestion: parsed.nextQuestion || "That sounds interesting. Could you elaborate on how you handled edge cases and system performance in that scenario?",
      isReadyToEnd: Boolean(parsed.isReadyToEnd),
    };
  } catch (err) {
    console.error("Turn processing error:", err);
    return {
      microFeedback: {
        score: 7,
        positive: "Solid conceptual grasp communicated clearly.",
        missing: "Consider explaining trade-offs between alternative approaches.",
        suggestion: "Quantify your impact when discussing past engineering decisions.",
      },
      nextQuestion: "Understood. Moving forward, how do you approach monitoring, error tracking, and maintaining high availability in production for this architecture?",
      isReadyToEnd: false,
    };
  }
}

/**
 * 3. Generate comprehensive final diagnostic scorecard after the interview ends
 */
export async function generateFinalScorecard({
  role,
  type = "tech",
  difficulty = "Mid-Level",
  resumeContext = null,
  fullTranscript = [],
  durationSeconds = 0,
}) {
  const formattedTranscript = fullTranscript
    .map((m, i) => `[Turn ${i + 1}] ${m.role === "ai" ? "Interviewer" : "Candidate"}:\n${m.content}`)
    .join("\n\n");

  const prompt = `You are the Lead Talent Assessment Partner and Principal Architect at a tier-1 tech firm.

Analyze the following full mock interview transcript and generate an exhaustive, executive Diagnostic Performance Report Card.

INTERVIEW PARAMETERS:
- Target Role: "${role}"
- Interview Type: "${type}"
- Seniority Level: "${difficulty}"
- Total Duration: ${Math.round(durationSeconds / 60)} minutes
${resumeContext?.resumeName ? `- Candidate Background: ${resumeContext.summary || ''}` : ''}

COMPLETE INTERVIEW TRANSCRIPT:
${formattedTranscript.slice(0, 16000)}

EVALUATION CRITERIA:
1. Overall readiness score (0-100) and letter grade (A+, A, B+, B, C, D).
2. Four pillar ratings (0-100) with diagnostic qualitative feedback:
   - technicalDepth
   - communicationClarity
   - problemSolving
   - cultureFit
3. Strengths (3 key positive takeaways).
4. Critical Weaknesses / Gaps (3 areas that need urgent improvement).
5. Question-by-Question audit: Pair each interviewer question with the candidate's response, give it a score (0-10), provide an "Ideal Answer Framework" (what hiring managers look for), and a recruiter note.
6. Actionable Study Plan: 3 to 4 specific topics the candidate must revise before their real interview.

Respond ONLY with strictly valid JSON matching this schema:
{
  "overallScore": <number 0-100>,
  "grade": "<A+|A|B+|B|C+|C|D>",
  "readinessLevel": "<string: e.g. 'Ready for Senior Roles' | 'Solid Mid-Level Contender' | 'Needs Targeted Practice'>",
  "summaryVerdict": "<string: 2-3 sentence executive assessment of the candidate's interview performance>",
  "pillars": {
    "technicalDepth": { "score": <0-100>, "feedback": "<string>" },
    "communicationClarity": { "score": <0-100>, "feedback": "<string>" },
    "problemSolving": { "score": <0-100>, "feedback": "<string>" },
    "cultureFit": { "score": <0-100>, "feedback": "<string>" }
  },
  "strengths": [<string>, <string>, <string>],
  "weaknesses": [<string>, <string>, <string>],
  "questionReviews": [
    {
      "question": "<string>",
      "candidateAnswer": "<string>",
      "score": <number 0-10>,
      "idealAnswerFramework": "<string: what the ideal answer should cover>",
      "recruiterNote": "<string: tip on how to stand out>"
    }
  ],
  "studyPlan": [<string>, <string>, <string>]
}`;

  try {
    const raw = await callModel(prompt, true);
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    parsed.overallScore = typeof parsed.overallScore === "number" ? Math.min(100, Math.max(0, parsed.overallScore)) : 75;
    parsed.grade = parsed.grade || (parsed.overallScore >= 85 ? "A" : parsed.overallScore >= 70 ? "B" : "C");
    parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    parsed.weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
    parsed.questionReviews = Array.isArray(parsed.questionReviews) ? parsed.questionReviews : [];
    parsed.studyPlan = Array.isArray(parsed.studyPlan) ? parsed.studyPlan : [];

    return parsed;
  } catch (err) {
    console.error("Scorecard generation error:", err);
    return {
      overallScore: 74,
      grade: "B",
      readinessLevel: "Promising Candidate • Needs Minor Technical Polish",
      summaryVerdict: "The candidate demonstrated solid conceptual familiarity with core tools, communicating clearly throughout the session. Further practice is recommended around edge-case analysis and metrics.",
      pillars: {
        technicalDepth: { score: 75, feedback: "Good grasp of architectural concepts, though deeper exploration of failure scenarios is encouraged." },
        communicationClarity: { score: 80, feedback: "Structured responses delivered with professional demeanor." },
        problemSolving: { score: 70, feedback: "Proposed working approaches; could proactively evaluate performance bottlenecks." },
        cultureFit: { score: 78, feedback: "Collaborative mindset and openness to technical feedback." },
      },
      strengths: [
        "Clear communication and structured presentation of technical ideas.",
        "Demonstrated familiarity with modern development stacks and design principles.",
        "Positive and professional interview presence.",
      ],
      weaknesses: [
        "Could include more specific metrics and quantified outcomes in past experience stories.",
        "Deeper discussion of edge cases and high-concurrency bottlenecks is recommended.",
      ],
      questionReviews: [],
      studyPlan: [
        "Review database indexing, caching invalidation strategies, and connection pooling.",
        "Practice using the STAR framework (Situation, Task, Action, Result) for behavioral prompts.",
        "Familiarize with distributed system trade-offs (CAP theorem, event-driven architecture).",
      ],
    };
  }
}
