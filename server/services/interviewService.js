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
  { id: 1, name: "Warm Intro & Background", targetQuestions: 2, description: "Warm introduction, background overview, career journey, and initial project highlight." },
  { id: 2, name: "Core Competency Drilldown", targetQuestions: 2, description: "Deep dive into core architecture, implementation trade-offs, algorithms, or technical design." },
  { id: 3, name: "Pressure & Edge Cases", targetQuestions: 2, description: "Real-world scale (100x load spikes), distributed failures, debugging, and edge-case handling." },
  { id: 4, name: "Reverse Q&A & Wrap-Up", targetQuestions: 1, description: "Candidate strategic questions, company/team dynamics, and final wrap-up." }
];

/**
 * 1. Generate opening question tailored to role, type, difficulty, and candidate resume
 */
export async function generateOpeningQuestion({ role, type = "tech", difficulty = "Mid-Level", resumeContext = null }) {
  const prompt = `You are a warm, highly experienced Senior Engineering Hiring Manager at a premier tech company conducting a mock interview.

INTERVIEW CONFIGURATION:
- Target Role: "${role}"
- Interview Type: "${type}" (tech: technical coding & concepts | behavioral: leadership, STAR, team dynamics | system: architecture, scalability, tradeoffs)
- Target Seniority Level: "${difficulty}"
${resumeContext?.resumeName ? `- Candidate Resume: Profile: "${resumeContext.summary || ''}", Key Skills: [${(resumeContext.keySkills || []).join(', ')}]` : ''}

OBJECTIVE:
Start the interview naturally, warmly, and realistically — just like a real-world human interviewer.
- Do NOT jump directly into difficult technical problems, complex architecture questions, or deep project grilling yet.
- Welcome the candidate warmly and thank them for joining today's session.
- Ask them for a relaxed, natural self-introduction: their background, their journey into ${role}, and what technologies or projects they have been focusing on recently.
- Keep the tone welcoming, conversational, and natural (2 to 3 sentences maximum).

Respond with ONLY the spoken greeting and opening intro question. No JSON, no quotes, no markdown headers.`;

  try {
    const raw = await callModel(prompt, false);
    return raw.replace(/^["']|["']$/g, "").trim();
  } catch (err) {
    console.warn("Opening question generation fallback:", err.message);
    if (type === "system") {
      return `Hi, great to meet you today! Thanks for joining our ${difficulty} System Design session for the ${role} position. To kick things off naturally, could you give me a brief introduction of yourself, your background, and the kind of architectures or systems you've been working with recently?`;
    }
    if (type === "behavioral") {
      return `Hi, great to connect with you! Thanks for taking the time to meet for our ${difficulty} ${role} interview. To get started, I'd love to hear a bit about your journey so far, your background, and what kind of work you're most passionate about.`;
    }
    return `Hi, great to meet you today! Thanks for taking the time to join our ${difficulty} ${role} interview. To kick things off smoothly, could you give me a brief introduction of yourself, your journey as a developer, and what you've been working on or enjoying lately?`;
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

  const prompt = `You are an elite, empathetic, and sharp Senior Engineering Hiring Manager conducting a live mock interview.

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

INTERACTION & EVALUATION RULES:
1. AUDIO / CONNECTIVITY TEST HANDLING:
   - If the candidate's latest response is an audio check or greeting (e.g. "am I audible", "can you hear me", "hello", "hi"), do NOT fail them or give 0.
   - Acknowledge warmly as a human: confirm you can hear them loud and clear, and proceed with the introductory question.
   - Return score: 8, positive: "Audio connectivity confirmed.", missing: "Ready for self-introduction.", suggestion: "Speak clearly and naturally."

2. NATURAL CONVERSATIONAL PROGRESSION:
   - Turn 1 (After candidate gives their introduction):
     - Acknowledge their background warmly with 1 brief conversational sentence (e.g. "Thanks for sharing that, Abhishek! It's great to hear about your experience with React and modern web development.").
     - Ask a natural follow-up: "Could you walk me through one specific project or product you built recently that you're most proud of, and what your exact ownership was?"
   - Turn 2 (After candidate describes their project):
     - Acknowledge what they built, then ask a targeted technical follow-up about that specific project (e.g. "When architecting that, what were some of the key trade-offs you considered, or how did you handle state management / caching / data fetching?").
   - Turns 3-4 (Phase 2 - Core Competency Drilldown):
     - Transition smoothly into deeper technical challenges: "Now let's dive into some deeper technical problems..." (ask targeted questions on algorithms, system components, framework internals, or design patterns).
   - Turns 5-6 (Phase 3 - Pressure & Edge Cases):
     - Introduce realistic production scale or edge cases: "Imagine traffic suddenly spikes 50x or an API service times out. How would your architecture handle it?"
   - Turn 7 (Phase 4 - Candidate Q&A & Wrap-Up):
     - Invite the candidate: "We're nearing the end of our time today. What questions do you have for me about the team, our engineering culture, or the tech stack?"

3. TONE & DELIVERY:
   - Always sound like a warm, supportive yet rigorous human interviewer.
   - Acknowledge what the candidate just said before asking the next question.
   - Keep "nextQuestion" conversational and focused (2-3 sentences max).

Respond ONLY with strictly valid JSON matching this schema:
{
  "microFeedback": {
    "score": <number 0-10>,
    "positive": "<string: 1 constructive sentence on what they explained well>",
    "missing": "<string: 1 constructive sentence on trade-offs, metrics, or nuances they could add>",
    "suggestion": "<string: 1 practical tip>",
    "clarityScore": <number 0-100>
  },
  "nextPhase": ${targetPhase},
  "phaseLabel": "${currentPhaseDef.name}",
  "nextQuestion": "<string: conversational acknowledgment + next question>",
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
