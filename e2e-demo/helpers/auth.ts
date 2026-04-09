import type { Page } from "@playwright/test";

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log in via the login page.
 * Assumes page is at any URL — navigates to /en/login.
 */
export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/en/login");
  await page.fill("#email", email);
  await page.type("#password", password, { delay: 40 });
  await pause(200);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 10_000,
  });
  await pause(500);
}
