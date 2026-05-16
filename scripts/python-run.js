import fs from "node:fs";
import path from "node:path";
import { printHeader, repoRoot, run, venvPythonPath } from "./_util.js";

const serviceDir = path.join(repoRoot, "interview-ai-service");
const venvPython = venvPythonPath(serviceDir);

function usage() {
  // eslint-disable-next-line no-console
  console.log("Usage: node scripts/python-run.js");
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  usage();
  process.exit(0);
}

if (!fs.existsSync(venvPython)) {
  // eslint-disable-next-line no-console
  console.error("Python venv not found. Run: npm run install-all");
  process.exit(1);
}

async function main() {
  printHeader("Python: starting interview-ai-service (uvicorn)");

  await run(
    venvPython,
    ["-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
    { cwd: serviceDir, label: "uvicorn" },
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err?.message || err);
  process.exit(1);
});
