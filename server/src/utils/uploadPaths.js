import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "src", "uploads");
const AVATARS_DIR = path.join(UPLOADS_ROOT, "avatars");
const RESUMES_DIR = UPLOADS_ROOT;

/**
 * Resolve a safe absolute path inside the uploads directory (blocks path traversal).
 */
export const resolveUploadPath = (subdir, filename) => {
  if (
    !filename ||
    typeof filename !== "string" ||
    filename.includes("..") ||
    /[\\/]/.test(filename)
  ) {
    return null;
  }

  const safeName = path.basename(filename);
  const baseDir = subdir === "avatars" ? AVATARS_DIR : RESUMES_DIR;
  const absolutePath = path.resolve(baseDir, safeName);
  const resolvedBase = path.resolve(baseDir);

  if (!absolutePath.startsWith(resolvedBase + path.sep) && absolutePath !== resolvedBase) {
    return null;
  }

  return { safeName, absolutePath };
};

export const buildAvatarFileUrl = (filename) => `/api/files/avatars/${filename}`;
export const buildResumeFileUrl = (filename) => `/api/files/resumes/${filename}`;
