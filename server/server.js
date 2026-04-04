import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import aiRouter from "./routes/aiRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Debug logger
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

// Protected AI routes
app.use("/api/ai", requireAuth(), aiRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
