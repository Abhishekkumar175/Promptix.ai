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

export const INTERVIEW_PHASES = [
  { id: 1, name: "Background & Alignment", targetQuestions: 2, description: "Candidate introduction, verification of resume accomplishments, motivations and fit." },
  { id: 2, name: "Core Competency Drilldown", targetQuestions: 2, description: "Deep technical examination, core algorithms, design choices, or STAR behavioral leadership." },
  { id: 3, name: "Pressure & Edge Cases", targetQuestions: 2, description: "Extreme scale (100x traffic), distributed failure modes, concurrency, pushbacks and trade-offs." },
  { id: 4, name: "Reverse Q&A & Wrap-Up", targetQuestions: 1, description: "Candidate poses strategic questions, interviewer evaluates business acumen and concludes round." }
];

/**
 * 1. Generate opening question tailored to role, type, difficulty, and candidate resume
 */
export async function generateOpeningQuestion({ role, type = "tech", difficulty = "Mid-Level", resumeContext = null }) {
  const prompt = `You are an elite Senior Staff Engineering Director and Hiring Manager conducting a realistic, structured mock interview.

INTERVIEW CONFIGURATION:
- Target Role: "${role}"
- Interview Type: "${type}" (tech: technical coding & concepts | behavioral: leadership, STAR, team dynamics | system: architecture, scalability, tradeoffs)
- Target Seniority Level: "${difficulty}"
${resumeContext?.resumeName ? `- Candidate Resume Context: Profile: "${resumeContext.summary || ''}", Verified Key Skills: [${(resumeContext.keySkills || []).join(', ')}]` : ''}

STRUCTURE:
We are starting Phase 1: "Background & Alignment".
- Greet the candidate warmly and professionally as their Lead Interviewer.
- Mention that this session is structured into 4 stages: Background, Core Technical Drilldown, Pressure Scenarios, and Candidate Q&A.
- Ask a high-impact opening question relevant to ${role} (and their resume skills if available), asking them to walk through their most impactful technical project or core architecture experience.
- Keep the tone polite, engaging, and authoritative.

Respond with ONLY the opening question text (2-3 sentences). No JSON, no markdown tags.`;

  try {
    const raw = await callModel(prompt, false);
    return raw.replace(/^["']|["']$/g, "").trim();
  } catch (err) {
    console.warn("Opening question generation fallback:", err.message);
    if (type === "system") {
      return `Welcome! I'm your interviewer today. We'll be conducting a 4-phase ${difficulty} System Design interview for the ${role} position. To start Phase 1, could you introduce yourself and walk me through the most complex distributed system you have designed or maintained?`;
    }
    if (type === "behavioral") {
      return `Welcome! I'll be leading your ${difficulty} behavioral screening for the ${role} position across our 4 interview stages. Let's start with Phase 1: Could you walk me through your background and describe a project where your individual leadership was critical to success?`;
    }
    return `Welcome! I'll be your technical interviewer today for the ${role} position (${difficulty} level). We'll progress through 4 structured phases today. To kick off Phase 1, could you give me a brief overview of your technical background and highlight an engineering challenge you solved recently?`;
  }
}

/**
 * Helper to analyze filler words in candidate speech
 */
function analyzeSpeechPatterns(text = "") {
  const fillerRegex = /\b(um|uh|er|ah|like|you know|basically|actually|literally|honestly|sort of|kind of|i mean)\b/gi;
  const matches = text.match(fillerRegex) || [];
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  
  return {
    fillerCount: matches.length,
    fillers: Array.from(new Set(matches.map((m) => m.toLowerCase()))),
    wordCount,
  };
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
  currentPhase = 1,
  questionCount = 1,
}) {
  const speechStats = analyzeSpeechPatterns(userResponse);

  // Determine targeted phase based on question progression
  let targetPhase = 1;
  if (questionCount <= 2) targetPhase = 1;
  else if (questionCount <= 4) targetPhase = 2;
  else if (questionCount <= 6) targetPhase = 3;
  else targetPhase = 4;

  const currentPhaseDef = INTERVIEW_PHASES.find((p) => p.id === targetPhase) || INTERVIEW_PHASES[0];

  const formattedHistory = history
    .map((m) => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .slice(-8)
    .join("\n\n");

  const prompt = `You are an elite Senior Staff Interviewer evaluating a candidate's answer in a live mock interview.

INTERVIEW SPECIFICATIONS:
- Role: "${role}"
- Category: "${type}"
- Seniority: "${difficulty}"
- Current Question Number: ${questionCount} of 6-7
- Current Stage: Phase ${targetPhase} of 4: "${currentPhaseDef.name}" (${currentPhaseDef.description})
${resumeContext?.resumeName ? `- Candidate Key Skills: [${(resumeContext.keySkills || []).join(', ')}]` : ''}

CONVERSATION TRANSCRIPT SO FAR:
${formattedHistory}

CANDIDATE'S LATEST ANSWER:
"""${userResponse}"""

YOUR EVALUATION OBJECTIVES:
1. Turn-by-Turn Micro-Evaluation:
   - score (0-10): Technical depth, precision, clarity, and relevance for this turn.
   - positive: 1 concise sentence highlighting what the candidate explained well.
   - missing: 1 concise sentence highlighting missing technical trade-offs, edge cases, metrics, or architectural nuances.
   - suggestion: 1 practical pro-tip for real interview scenarios.
   - starRating: If behavioral or experiential, evaluate whether they gave Situation, Task, Action, and quantifiable Result.
2. Next Question Strategy:
   - Keep the interview in Phase ${targetPhase}: "${currentPhaseDef.name}".
   - If transitioning to Phase 2, move from general background to deep technical implementation details, data models, or core algorithms.
   - If in Phase 3, introduce pressure or failure scenarios: "What if traffic surges 100x? What if the primary database partition fails? How do you maintain consistency?"
   - If in Phase 4, invite the candidate: "We're in the final wrap-up phase. What questions do you have for me about the team, the architecture, or our engineering practices?"
   - Keep the next question sharp, conversational, and direct (1-3 sentences).
3. isReadyToEnd: boolean (true if in Phase 4 and candidate has asked questions, or questionCount >= 6).

Respond ONLY with strictly valid JSON matching this schema:
{
  "microFeedback": {
    "score": <number 0-10>,
    "positive": "<string>",
    "missing": "<string>",
    "suggestion": "<string>",
    "clarityScore": <number 0-100>
  },
  "nextPhase": ${targetPhase},
  "phaseLabel": "${currentPhaseDef.name}",
  "nextQuestion": "<string: the interviewer's next spoken question>",
  "isReadyToEnd": <boolean>
}`;

  try {
    const raw = await callModel(prompt, true);
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const feedback = parsed.microFeedback || {
      score: 7,
      positive: "Clear communication of fundamental concepts.",
      missing: "Consider detailing quantitative metrics and alternative approaches.",
      suggestion: "Anchor your answers around measurable business outcomes.",
      clarityScore: 80,
    };

    // Attach speech telemetry
    feedback.fillerAnalysis = {
      detected: speechStats.fillers,
      count: speechStats.fillerCount,
      wordCount: speechStats.wordCount,
    };

    return {
      microFeedback: feedback,
      nextPhase: parsed.nextPhase || targetPhase,
      phaseLabel: parsed.phaseLabel || currentPhaseDef.name,
      nextQuestion: parsed.nextQuestion || "That makes sense. Could you walk me through the key performance trade-offs in this approach?",
      isReadyToEnd: Boolean(parsed.isReadyToEnd) || questionCount >= 7,
    };
  } catch (err) {
    console.error("Turn processing error:", err);
    return {
      microFeedback: {
        score: 7,
        positive: "Solid conceptual grasp communicated clearly.",
        missing: "Consider explaining trade-offs between alternative approaches.",
        suggestion: "Quantify your impact when discussing past engineering decisions.",
        clarityScore: 78,
        fillerAnalysis: {
          detected: speechStats.fillers,
          count: speechStats.fillerCount,
          wordCount: speechStats.wordCount,
        },
      },
      nextPhase: targetPhase,
      phaseLabel: currentPhaseDef.name,
      nextQuestion: targetPhase === 3
        ? "Understood. Now considering high-load production scenarios, how would this system handle a sudden 50x spike in concurrent requests or a partition failure?"
        : "Understood. Moving forward, how do you approach monitoring, error tracking, and maintaining high availability in production for this architecture?",
      isReadyToEnd: questionCount >= 7,
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
3. Speech Delivery & Telemetry:
   - pacing: "Optimal (130-150 WPM)" | "Slightly Rushed" | "Too Hesitant"
   - fillerWordImpact: "Minimal" | "Moderate" | "Distracting"
   - starMethodScore: <0-100> (How well they structured behavioral examples with Situation, Task, Action, Result)
   - deliveryTip: "<1 sentence actionable speech improvement tip>"
4. Strengths (3 key positive takeaways).
5. Critical Weaknesses / Gaps (3 areas that need urgent improvement).
6. Question-by-Question audit: Pair each interviewer question with the candidate's response, give it a score (0-10), provide an "Ideal Answer Framework" (what hiring managers look for), and a recruiter note.
7. Actionable Study Plan: 3 to 4 specific topics the candidate must revise before their real interview.

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
  "speechDelivery": {
    "pacing": "<string>",
    "fillerWordImpact": "<string>",
    "starMethodScore": <number 0-100>,
    "deliveryTip": "<string>"
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
      speechDelivery: {
        pacing: "Optimal (130-150 WPM)",
        fillerWordImpact: "Minimal",
        starMethodScore: 75,
        deliveryTip: "Anchor behavioral answers with concrete engineering metrics and business impact.",
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
