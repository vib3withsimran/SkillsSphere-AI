import fs from "fs";
import path from "path";
import User from "../../database/models/User.js";
import Resume from "../../database/models/Resume.js";
import AppError from "../../utils/AppError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { resolveUploadPath } from "../../utils/uploadPaths.js";

const sendFileIfExists = (res, absolutePath, filename) => {
  if (!fs.existsSync(absolutePath)) {
    return false;
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeByExt = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };

  res.setHeader("Content-Type", mimeByExt[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", "private, no-store");
  res.sendFile(absolutePath);
  return true;
};

/**
 * @desc    Serve a resume file (owner only)
 * @route   GET /api/files/resumes/:filename
 */
export const serveResume = asyncHandler(async (req, res, next) => {
  const resolved = resolveUploadPath("resumes", req.params.filename);

  if (!resolved) {
    return next(new AppError("Invalid file path", 400));
  }

  const ownedResume = await Resume.findOne({
    user: req.user._id,
    $or: [
      { "file.storedName": resolved.safeName },
      { "file.path": { $regex: resolved.safeName } },
    ],
  }).select("_id");

  if (!ownedResume) {
    return next(
      new AppError("You do not have permission to access this file", 403)
    );
  }

  if (!sendFileIfExists(res, resolved.absolutePath, resolved.safeName)) {
    return next(new AppError("File not found", 404));
  }
});

/**
 * @desc    Serve an avatar image (any authenticated user)
 * @route   GET /api/files/avatars/:filename
 */
export const serveAvatar = asyncHandler(async (req, res, next) => {
  const resolved = resolveUploadPath("avatars", req.params.filename);

  if (!resolved) {
    return next(new AppError("Invalid file path", 400));
  }

  const avatarOwner = await User.findOne({
    profilePic: { $regex: resolved.safeName },
  }).select("_id");

  if (!avatarOwner) {
    return next(new AppError("File not found", 404));
  }

  if (!sendFileIfExists(res, resolved.absolutePath, resolved.safeName)) {
    return next(new AppError("File not found", 404));
  }
});
