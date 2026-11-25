import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  generateImage,
  enhancePrompt,
  getUserImages,
  deleteImage,
} from "../controllers/imageController.js";

const router = express.Router();

router.post("/generate", auth, generateImage);
router.post("/enhance-prompt", auth, enhancePrompt);
router.get("/history", auth, getUserImages);
router.delete("/:id", auth, deleteImage);

export default router;
