import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import chatRouter from "./routes/chatRoutes.js";
import templateRouter from "./routes/templateRoutes.js";
import pdfRouter from "./routes/pdfRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";

const app = express();

// ── Middleware ──
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", process.env.CLIENT_URL].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(clerkMiddleware());

// ── Health check ──
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Promptix API running" });
});

// ── Routes ──
app.use("/api/chat", chatRouter);           // Chat threads + SSE streaming
app.use("/api/templates", templateRouter);  // Prompt templates (public browse)
app.use("/api/pdf", pdfRouter);             // Chat with PDF (RAG)
app.use("/api/resume", resumeRouter);       // Resume analysis

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Promptix server running on http://localhost:${PORT}`);
});
