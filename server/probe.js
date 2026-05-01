import "dotenv/config";
import { streamChat } from "./services/aiService.js";

async function run() {
  console.log("Testing OpenRouter Key:", process.env.OPENROUTER_API_KEY ? "Loaded" : "Missing");
  await streamChat({
    history: [],
    userMessage: "Reply with the word 'SUCCESS'",
    onChunk: (c) => process.stdout.write(c)
  });
  console.log("\nDone!");
  process.exit(0);
}
run().catch(console.error);
