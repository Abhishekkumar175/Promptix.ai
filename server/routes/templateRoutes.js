import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  getTemplates,
  getCategories,
  getTemplate,
  useTemplate,
} from "../controllers/templateController.js";

const router = express.Router();

// Public routes (no auth needed to browse templates)
router.get("/", getTemplates);
router.get("/categories", getCategories);
router.get("/:id", getTemplate);

// Auth required to track usage
router.post("/:id/use", auth, useTemplate);

export default router;
