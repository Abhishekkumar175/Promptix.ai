import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function probe() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const m = "gemini-2.0-flash";
  
  try {
    const model = genAI.getGenerativeModel({ model: m });
    const result = await model.generateContent("hi");
    console.log(`✅ ${m}: OK - Response: "${result.response.text().slice(0, 10)}..."`);
    process.exit(0);
  } catch (e) {
    console.log(`❌ ${m}: FAIL - ${e.message}`);
    process.exit(1);
  }
}

probe();
