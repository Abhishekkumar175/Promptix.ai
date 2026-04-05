import express from "express";
import { auth } from "../middlewares/auth.js";
import { uploadMiddleware } from "../middlewares/upload.js";
import { uploadPDF, listFiles, getFileStatus, deleteFile, queryPDF } from "../controllers/pdfController.js";

const router = express.Router();

router.post("/upload", auth, uploadMiddleware.single("file"), uploadPDF);
router.get("/files", auth, listFiles);
router.get("/files/:fileId/status", auth, getFileStatus);
router.delete("/files/:fileId", auth, deleteFile);
router.post("/query", auth, queryPDF);

export default router;
