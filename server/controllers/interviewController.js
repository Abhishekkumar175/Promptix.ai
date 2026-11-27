import sql from "../configs/db.js";
import {
  generateOpeningQuestion,
  processInterviewTurn,
  generateFinalScorecard,
} from "../services/interviewService.js";

/**
 * POST /api/interview/start
 * Initialize a new interview session and generate the personalized opening question
 */
export const startSession = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { role, type = "tech", difficulty = "Mid-Level", resumeContext = null } = req.body;

    if (!role || !role.trim()) {
      return res.status(400).json({ success: false, message: "Target role is required." });
    }

    // 1. Generate opening question
    const openingQuestion = await generateOpeningQuestion({
      role: role.trim(),
      type,
      difficulty,
      resumeContext,
    });

    // 2. Create session in DB
    const [session] = await sql`
      INSERT INTO interview_sessions (
        user_id, role, type, difficulty, resume_context, status, current_phase
      ) VALUES (
        ${userId}, ${role.trim()}, ${type}, ${difficulty}, ${resumeContext ? JSON.stringify(resumeContext) : null}, 'active', 1
      )
      RETURNING *
    `;

    // 3. Save initial opening message from AI
    const [aiMessage] = await sql`
      INSERT INTO interview_messages (
        session_id, role, content
      ) VALUES (
        ${session.id}, 'ai', ${openingQuestion}
      )
      RETURNING *
    `;

    res.json({
      success: true,
      session,
      openingMessage: aiMessage,
      currentPhase: 1,
      phaseLabel: "Background & Alignment",
      questionNumber: 1,
      totalExpectedQuestions: 6,
    });
  } catch (err) {
    console.error("Start interview session error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to start interview session." });
  }
};

/**
 * POST /api/interview/:id/message
 * Candidate submits an answer; evaluate it turn-by-turn and generate follow-up question
 */
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;
    const { message, elapsedTime = 0 } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required." });
    }

    // 1. Verify session
    const [session] = await sql`
      SELECT * FROM interview_sessions
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (!session) {
      return res.status(404).json({ success: false, message: "Interview session not found." });
    }

    if (session.status !== "active") {
      return res.status(400).json({ success: false, message: "This interview session has already ended." });
    }

    // 2. Store candidate's message
    const [userMsg] = await sql`
      INSERT INTO interview_messages (
        session_id, role, content
      ) VALUES (
        ${id}, 'user', ${message.trim()}
      )
      RETURNING *
    `;

    // 3. Retrieve recent conversation history & calculate question turn count
    const history = await sql`
      SELECT role, content FROM interview_messages
      WHERE session_id = ${id}
      ORDER BY created_at ASC
    `;

    const userAnswersCount = history.filter((m) => m.role === "user").length;

    // 4. AI evaluates turn and generates follow-up
    const turnResult = await processInterviewTurn({
      role: session.role,
      type: session.type,
      difficulty: session.difficulty,
      resumeContext: session.resume_context,
      history,
      userResponse: message.trim(),
      currentPhase: session.current_phase || 1,
      questionCount: userAnswersCount,
    });

    // 5. Store micro_feedback on candidate's message
    if (turnResult.microFeedback) {
      await sql`
        UPDATE interview_messages
        SET micro_feedback = ${JSON.stringify(turnResult.microFeedback)}
        WHERE id = ${userMsg.id}
      `;
      userMsg.micro_feedback = turnResult.microFeedback;
    }

    // 6. Save AI's next question
    const [aiMsg] = await sql`
      INSERT INTO interview_messages (
        session_id, role, content
      ) VALUES (
        ${id}, 'ai', ${turnResult.nextQuestion}
      )
      RETURNING *
    `;

    // 7. Update duration & current phase telemetry
    await sql`
      UPDATE interview_sessions
      SET duration_seconds = GREATEST(duration_seconds, ${elapsedTime}),
          current_phase = ${turnResult.nextPhase || session.current_phase || 1}
      WHERE id = ${id}
    `;

    res.json({
      success: true,
      userMessage: userMsg,
      aiMessage: aiMsg,
      microFeedback: turnResult.microFeedback,
      currentPhase: turnResult.nextPhase || 1,
      phaseLabel: turnResult.phaseLabel || "Interview In Progress",
      questionNumber: userAnswersCount + 1,
      totalExpectedQuestions: 6,
      isReadyToEnd: turnResult.isReadyToEnd,
    });
  } catch (err) {
    console.error("Send interview message error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to process interview message." });
  }
};

/**
 * POST /api/interview/:id/finish
 * End interview session and generate the comprehensive diagnostic performance scorecard
 */
export const finishSession = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;
    const { durationSeconds = 0 } = req.body;

    // 1. Verify session
    const [session] = await sql`
      SELECT * FROM interview_sessions
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (!session) {
      return res.status(404).json({ success: false, message: "Interview session not found." });
    }

    // 2. Fetch full transcript
    const fullTranscript = await sql`
      SELECT id, role, content, micro_feedback, created_at
      FROM interview_messages
      WHERE session_id = ${id}
      ORDER BY created_at ASC
    `;

    // 3. Generate diagnostic scorecard
    const finalScorecard = await generateFinalScorecard({
      role: session.role,
      type: session.type,
      difficulty: session.difficulty,
      resumeContext: session.resume_context,
      fullTranscript,
      durationSeconds: durationSeconds || session.duration_seconds || 0,
    });

    // 4. Update session status & scores in DB
    const [updatedSession] = await sql`
      UPDATE interview_sessions
      SET
        status = 'completed',
        overall_score = ${finalScorecard.overallScore || 75},
        scorecard = ${JSON.stringify(finalScorecard)},
        duration_seconds = ${durationSeconds || session.duration_seconds || 0},
        completed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    res.json({
      success: true,
      session: updatedSession,
      scorecard: finalScorecard,
    });
  } catch (err) {
    console.error("Finish interview session error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to finalize interview session." });
  }
};

/**
 * GET /api/interview/history
 * List user's past interview sessions
 */
export const getHistory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const sessions = await sql`
      SELECT id, role, type, difficulty, status, overall_score, duration_seconds, created_at, completed_at
      FROM interview_sessions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    res.json({ success: true, sessions });
  } catch (err) {
    console.error("Get interview history error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/interview/:id
 * Retrieve full details (transcript + scorecard) of a specific interview session
 */
export const getSessionDetails = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    const [session] = await sql`
      SELECT * FROM interview_sessions
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (!session) {
      return res.status(404).json({ success: false, message: "Interview session not found." });
    }

    const messages = await sql`
      SELECT id, role, content, micro_feedback, created_at
      FROM interview_messages
      WHERE session_id = ${id}
      ORDER BY created_at ASC
    `;

    res.json({
      success: true,
      session,
      messages,
      scorecard: session.scorecard,
    });
  } catch (err) {
    console.error("Get session details error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/interview/:id
 * Delete an interview session
 */
export const deleteSession = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    await sql`
      DELETE FROM interview_sessions
      WHERE id = ${id} AND user_id = ${userId}
    `;

    res.json({ success: true, message: "Interview session removed from history." });
  } catch (err) {
    console.error("Delete interview session error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
