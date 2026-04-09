import { mkdir, rename } from "node:fs/promises";
import path from "node:path";
import type { BrowserContext } from "@playwright/test";

const RECORDINGS_DIR = path.resolve(import.meta.dirname, "../recordings");

export interface RecordingResult {
  role: string;
  path: string;
}

/**
 * After a context is closed, move its auto-named video to
 * `recordings/<flowName>/<role>.webm`.
 */
export async function saveRecording(
  context: BrowserContext,
  flowName: string,
  role: string,
): Promise<RecordingResult> {
  const pages = context.pages();
  const page = pages[0];
  if (!page) throw new Error(`No pages in context for role "${role}"`);

  // Close context to finalize the video file
  const video = page.video();
  if (!video) throw new Error(`No video for role "${role}" — is video recording enabled?`);

  const srcPath = await video.path();
  if (!srcPath) throw new Error(`Video path is null for role "${role}"`);

  const destDir = path.join(RECORDINGS_DIR, flowName);
  await mkdir(destDir, { recursive: true });
  const destPath = path.join(destDir, `${role}.webm`);

  await rename(srcPath, destPath);

  return { role, path: destPath };
}
