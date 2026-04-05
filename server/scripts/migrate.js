import sql from "../configs/db.js";

async function migrate() {
  console.log("Running migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      title VARCHAR(255) DEFAULT 'New Chat',
      model VARCHAR(50) DEFAULT 'gemini-1.5-flash',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✓ chat_threads");

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'model')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✓ chat_messages");

  await sql`
    CREATE TABLE IF NOT EXISTS prompt_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      prompt TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      tags TEXT[] DEFAULT '{}',
      usage_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✓ prompt_templates");

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_threads_user ON chat_threads(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_templates_category ON prompt_templates(category)`;
  console.log("✓ indexes");

  // Seed prompt templates if empty
  const existing = await sql`SELECT COUNT(*) as count FROM prompt_templates`;
  if (parseInt(existing[0].count) === 0) {
    await sql`
      INSERT INTO prompt_templates (title, description, prompt, category, tags) VALUES
      ('Blog Post Generator', 'Generate a well-structured blog post on any topic', 'Write a comprehensive, engaging blog post about [TOPIC]. Include an introduction, 3-5 main sections with subheadings, and a conclusion. Use a conversational yet professional tone. Target length: [LENGTH] words.', 'Writing', ARRAY['blog', 'content', 'writing']),
      ('LinkedIn Post', 'Create a professional LinkedIn post', 'Write a compelling LinkedIn post about [TOPIC]. Make it engaging, professional, and include a call to action. Use 2-3 relevant emojis. Keep it under 300 words.', 'Marketing', ARRAY['linkedin', 'social', 'professional']),
      ('Code Review', 'Get detailed code review and suggestions', 'Review the following code and provide: 1) Overall assessment 2) Bugs or potential issues 3) Performance improvements 4) Best practices violations 5) Refactored version:\n\n[CODE]', 'Coding', ARRAY['code', 'review', 'programming']),
      ('SQL Query Builder', 'Build complex SQL queries from plain English', 'Write a SQL query that [DESCRIPTION]. Include comments explaining each part. Consider performance with indexes where appropriate. Database: [DATABASE_TYPE]', 'Coding', ARRAY['sql', 'database', 'query']),
      ('Essay Outline', 'Create a detailed essay outline', 'Create a detailed outline for an academic essay about [TOPIC]. Include: thesis statement, introduction points, 3-4 main arguments with supporting points, counterargument addressed, and a strong conclusion. Citation style: [STYLE]', 'Academic', ARRAY['essay', 'academic', 'outline']),
      ('Research Summary', 'Summarize complex research papers', 'Summarize the following research/article in simple terms: [TEXT]. Provide: 1) Main findings (3-5 bullet points) 2) Methodology overview 3) Practical implications 4) Limitations mentioned', 'Academic', ARRAY['research', 'summary', 'academic']),
      ('Product Description', 'Write compelling product descriptions', 'Write a persuasive product description for [PRODUCT_NAME]. Key features: [FEATURES]. Target audience: [AUDIENCE]. Include: headline, value proposition, 3-4 feature benefits, and a call to action. Tone: [TONE]', 'Marketing', ARRAY['product', 'ecommerce', 'copywriting']),
      ('Cold Email', 'Write effective cold outreach emails', 'Write a cold outreach email to [RECIPIENT_ROLE] at [COMPANY_TYPE]. Purpose: [GOAL]. Keep it under 150 words, personalized, with clear value proposition and a specific CTA. Avoid generic openers.', 'Marketing', ARRAY['email', 'outreach', 'sales']),
      ('Bug Fix Request', 'Describe a bug and get a fix', 'I have a bug in my [LANGUAGE] code. Here is what should happen: [EXPECTED]. Here is what actually happens: [ACTUAL]. Here is the relevant code:\n\n[CODE]\n\nPlease identify the bug and provide a corrected version with explanation.', 'Coding', ARRAY['bug', 'debugging', 'fix']),
      ('Interview Prep', 'Prepare for job interviews', 'Generate 10 common interview questions for a [JOB_TITLE] role at a [COMPANY_TYPE]. For each question, provide: the question, what the interviewer is looking for, and a sample strong answer framework. Focus on [INTERVIEW_TYPE] questions.', 'Career', ARRAY['interview', 'career', 'job']),
      ('Meeting Notes Summarizer', 'Turn raw notes into structured summary', 'Turn these raw meeting notes into a clean, structured summary:\n\n[NOTES]\n\nFormat as: Meeting Purpose, Key Decisions, Action Items (with owners), Next Steps, and Open Questions.', 'Business', ARRAY['meeting', 'notes', 'summary']),
      ('System Design Prompt', 'Get help with system design questions', 'Walk me through how to design [SYSTEM_NAME] for [SCALE, e.g., 1 million users]. Cover: requirements clarification, high-level architecture, key components, data model, API design, scalability considerations, and trade-offs.', 'Coding', ARRAY['system-design', 'architecture', 'interview'])
    `;
    console.log("✓ Seeded 12 prompt templates");
  }

  console.log("\n✅ All migrations complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
