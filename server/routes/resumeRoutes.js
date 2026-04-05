import express from "express";
import { auth } from "../middlewares/auth.js";
import { uploadMiddleware } from "../middlewares/upload.js";
import { analyzeResume, getResumeHistory } from "../controllers/resumeController.js";

const router = express.Router();

router.post("/analyze", auth, uploadMiddleware.single("file"), analyzeResume);
router.get("/history", auth, getResumeHistory);

export default router;
