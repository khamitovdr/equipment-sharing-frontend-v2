import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users, demoAvatar } from "../fixtures/seed-data.js";

const fillRegistrationForm: ActionHandler = async (page, { data }) => {
  const u = data as typeof users.fresh;

  // Upload avatar first — visible at top of form
  const fileInput = page.locator('input[type="file"][accept="image/*"]');
  await fileInput.setInputFiles(demoAvatar);
  // Wait for upload + processing to complete (avatar preview appears)
  await page.locator('img[alt="Profile photo"]').waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForTimeout(800);

  // Fill text fields with visible typing
  await page.type("#name", u.name, { delay: 50 });
  await page.waitForTimeout(300);
  await page.type("#surname", u.surname, { delay: 50 });
  await page.waitForTimeout(300);
  await page.type("#email", u.email, { delay: 40 });
  await page.waitForTimeout(300);

  // Phone — custom component
  const phoneInput = page.locator('input[type="tel"]');
  await phoneInput.click();
  await phoneInput.type(u.phone, { delay: 40 });
  await page.waitForTimeout(300);

  // Password fields
  await page.type("#password", u.password, { delay: 40 });
  await page.waitForTimeout(300);
  await page.type("#confirm_password", u.password, { delay: 40 });
  await page.waitForTimeout(500);
};

const flow: FlowDefinition = {
  name: "01-registration",
  description: "New user signs up, uploads avatar, and lands on home page",
  roles: {
    user: { auth: null },
  },
  steps: [
    // Start from home page
    { role: "user", action: "navigate", target: "/en", description: "Open home page" },
    { role: "user", pause: 2000 },

    // Click "Sign up" in navbar
    { role: "user", action: "click", target: 'a[href="/register"]', description: "Click Sign up" },
    { role: "user", action: "waitFor", target: "#name", data: { state: "visible" }, description: "Wait for register form" },
    { role: "user", pause: 1000 },

    // Fill the form with human-speed typing
    { role: "user", action: "fillRegistrationForm", data: users.fresh as any, description: "Fill registration form" },
    { role: "user", pause: 800 },

    // Scroll to see submit button if needed
    { role: "user", action: "scroll", target: 'button[type="submit"]', description: "Scroll to submit" },
    { role: "user", pause: 500 },

    // Submit
    { role: "user", action: "click", target: 'button[type="submit"]', description: "Submit registration" },

    // Wait for redirect and show where you land
    { role: "user", action: "waitFor", target: "text=Equip Me", data: { state: "visible" }, description: "Wait for redirect" },
    { role: "user", pause: 3000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = { fillRegistrationForm };
