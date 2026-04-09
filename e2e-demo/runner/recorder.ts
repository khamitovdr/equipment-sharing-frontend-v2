import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Page } from "@playwright/test";

const RECORDINGS_DIR = path.resolve(import.meta.dirname, "../recordings");

export interface RecordingResult {
  role: string;
  path: string;
}

/**
 * Save a page's video recording to `recordings/<flowName>/<role>.webm`.
 * Must be called AFTER the context is closed (to finalize the video).
 */
export async function saveRecording(
  page: Page,
  flowName: string,
  role: string,
): Promise<RecordingResult> {
  const video = page.video();
  if (!video) throw new Error(`No video for role "${role}" — is video recording enabled?`);

  const destDir = path.join(RECORDINGS_DIR, flowName);
  await mkdir(destDir, { recursive: true });
  const destPath = path.join(destDir, `${role}.webm`);

  await video.saveAs(destPath);

  return { role, path: destPath };
}
