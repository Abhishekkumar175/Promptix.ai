import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  getThreads,
  createThread,
  getMessages,
  deleteThread,
  streamMessage,
} from "../controllers/chatController.js";

const router = express.Router();

// All routes require auth
router.get("/threads", auth, getThreads);
router.post("/threads", auth, createThread);
router.get("/threads/:threadId/messages", auth, getMessages);
router.delete("/threads/:threadId", auth, deleteThread);
router.post("/threads/:threadId/stream", auth, streamMessage);

export default router;
