import express from "express";
import { auth } from "../middlewares/auth.js";
import { uploadMiddleware } from "../middlewares/upload.js";
import {
  analyzeResume,
  getResumeHistory,
  getResumeReviewById,
  deleteResumeReview,
} from "../controllers/resumeController.js";

const router = express.Router();

router.post("/analyze", auth, uploadMiddleware.single("file"), analyzeResume);
router.get("/history", auth, getResumeHistory);
router.get("/history/:id", auth, getResumeReviewById);
router.delete("/history/:id", auth, deleteResumeReview);

export default router;
