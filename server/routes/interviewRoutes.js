import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  startSession,
  sendMessage,
  finishSession,
  getHistory,
  getSessionDetails,
  deleteSession,
} from "../controllers/interviewController.js";

const router = express.Router();

router.post("/start", auth, startSession);
router.post("/:id/message", auth, sendMessage);
router.post("/:id/finish", auth, finishSession);
router.get("/history", auth, getHistory);
router.get("/:id", auth, getSessionDetails);
router.delete("/:id", auth, deleteSession);

export default router;
