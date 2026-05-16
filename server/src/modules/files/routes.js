import express from "express";
import { protectFileAccess } from "../../middleware/fileAuthMiddleware.js";
import { serveResume, serveAvatar } from "./controller.js";

const router = express.Router();

// All file access requires authentication (header or ?token= for images)
router.get("/resumes/:filename", protectFileAccess, serveResume);
router.get("/avatars/:filename", protectFileAccess, serveAvatar);

export default router;
