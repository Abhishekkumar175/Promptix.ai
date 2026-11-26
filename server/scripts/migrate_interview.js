import dotenv from "dotenv";
dotenv.config();
import sql from "../configs/db.js";

async function migrateInterview() {
  console.log("Running Mock Interview database migrations...");

  // 1. Interview Sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS interview_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      role VARCHAR(150) NOT NULL,
      type VARCHAR(50) DEFAULT 'tech',
      difficulty VARCHAR(50) DEFAULT 'Mid-Level',
      resume_context JSONB,
      status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
      overall_score INT,
      scorecard JSONB,
      duration_seconds INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;
  console.log("✓ interview_sessions table ready");

  // 2. Interview Messages table
  await sql`
    CREATE TABLE IF NOT EXISTS interview_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('ai', 'user', 'system')),
      content TEXT NOT NULL,
      micro_feedback JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✓ interview_messages table ready");

  // 3. Performance Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_sessions_user ON interview_sessions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_sessions_created ON interview_sessions(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_messages_session ON interview_messages(session_id, created_at ASC)`;
  console.log("✓ interview indexes ready");

  console.log("\n✅ Mock Interview migrations completed successfully!");
  process.exit(0);
}

migrateInterview().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
