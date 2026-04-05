import sql from "../configs/db.js";

async function migrate() {
  console.log("Running Phase 2 migrations...");

  // PDF files metadata table
  await sql`
    CREATE TABLE IF NOT EXISTS pdf_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      page_count INT DEFAULT 0,
      chunk_count INT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✓ pdf_files");

  // PDF chunks with embeddings stored as array of floats
  await sql`
    CREATE TABLE IF NOT EXISTS pdf_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_id UUID NOT NULL REFERENCES pdf_files(id) ON DELETE CASCADE,
      chunk_index INT NOT NULL,
      page_number INT DEFAULT 1,
      content TEXT NOT NULL,
      embedding FLOAT8[]
    )
  `;
  console.log("✓ pdf_chunks");

  // Resume reviews storage
  await sql`
    CREATE TABLE IF NOT EXISTS resume_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      ats_score INT,
      analysis JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✓ resume_reviews");

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_pdf_files_user ON pdf_files(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pdf_chunks_file ON pdf_chunks(file_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_resume_reviews_user ON resume_reviews(user_id)`;
  console.log("✓ indexes");

  console.log("\n✅ Phase 2 migrations complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
