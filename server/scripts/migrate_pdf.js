import dotenv from "dotenv";
dotenv.config();
import sql from "../configs/db.js";

async function migrate() {
  console.log("Running PDF tables migration...");

  // 1. Create or ensure pdf_files table
  await sql`
    CREATE TABLE IF NOT EXISTS pdf_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size BIGINT DEFAULT 0,
      page_count INT DEFAULT 0,
      full_text TEXT,
      status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // In case table already existed from phase2, ensure columns exist
  await sql`ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0`;
  await sql`ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS page_count INT DEFAULT 0`;
  await sql`ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS full_text TEXT`;
  await sql`ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'processing'`;
  await sql`ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;
  console.log("✓ pdf_files table & columns ready");

  // 2. Create pdf_messages table for persistent chat history
  await sql`
    CREATE TABLE IF NOT EXISTS pdf_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_id UUID NOT NULL REFERENCES pdf_files(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'model')),
      content TEXT NOT NULL,
      citations JSONB DEFAULT '[]',
      follow_ups JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE pdf_messages ADD COLUMN IF NOT EXISTS follow_ups JSONB DEFAULT '[]'`;
  console.log("✓ pdf_messages table & follow_ups column ready");

  // 3. Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_pdf_files_user ON pdf_files(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pdf_messages_file ON pdf_messages(file_id)`;
  console.log("✓ indexes ready");

  console.log("\n✅ PDF migration completed successfully!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
