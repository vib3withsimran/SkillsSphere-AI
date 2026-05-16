import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { resolveUploadPath } from "../../../utils/uploadPaths.js";

describe("resolveUploadPath", () => {
  it("rejects path traversal in filename", () => {
    const result = resolveUploadPath("resumes", "../../../etc/passwd");
    assert.equal(result, null);
  });

  it("returns safe basename for valid filenames", () => {
    const result = resolveUploadPath("resumes", "resume-123.pdf");
    assert.ok(result);
    assert.equal(result.safeName, "resume-123.pdf");
    assert.ok(result.absolutePath.endsWith("resume-123.pdf"));
  });

  it("rejects filenames containing path separators", () => {
    const result = resolveUploadPath("avatars", "foo/../../secret.jpg");
    assert.equal(result, null);
  });
});
