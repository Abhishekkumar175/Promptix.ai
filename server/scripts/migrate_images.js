import dotenv from "dotenv";
dotenv.config();
import sql from "../configs/db.js";

async function migrate() {
  console.log("Running generated_images migration...");

  await sql`
    CREATE TABLE IF NOT EXISTS generated_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      prompt TEXT NOT NULL,
      enhanced_prompt TEXT,
      style VARCHAR(50) DEFAULT 'Cinematic',
      aspect_ratio VARCHAR(10) DEFAULT '1:1',
      image_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✓ generated_images table ready");

  await sql`CREATE INDEX IF NOT EXISTS idx_generated_images_user ON generated_images(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_generated_images_created ON generated_images(created_at DESC)`;
  console.log("✓ indexes ready");

  console.log("\n✅ Image Studio migration completed successfully!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
