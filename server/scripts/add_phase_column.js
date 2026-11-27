import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });
import sql from "../configs/db.js";

async function addPhaseColumn() {
  await sql`ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS current_phase INT DEFAULT 1`;
  console.log("✓ current_phase column ready in interview_sessions");
  process.exit(0);
}

addPhaseColumn().catch((err) => {
  console.error("Failed to add phase column:", err);
  process.exit(1);
});
