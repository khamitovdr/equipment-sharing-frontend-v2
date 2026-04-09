import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users, demoAvatar } from "../fixtures/seed-data.js";

const fillRegistrationForm: ActionHandler = async (page, { data }) => {
  const u = data as typeof users.fresh;

  // Upload avatar
  const fileInput = page.locator('input[type="file"][accept="image/*"]');
  await fileInput.setInputFiles(demoAvatar);
  await page.waitForTimeout(1000); // wait for upload

  // Fill text fields
  await page.fill("#name", u.name);
  await page.fill("#surname", u.surname);
  await page.fill("#email", u.email);

  // Phone — custom component, type into visible input
  const phoneInput = page.locator('input[type="tel"]');
  await phoneInput.click();
  await phoneInput.fill(u.phone);

  // Password fields
  await page.type("#password", u.password, { delay: 30 });
  await page.type("#confirm_password", u.password, { delay: 30 });
};

const flow: FlowDefinition = {
  name: "01-registration",
  description: "New user signs up, uploads avatar, and lands on home page",
  roles: {
    user: { auth: null }, // No login — registering fresh
  },
  steps: [
    { role: "user", action: "navigate", target: "/en/register", description: "Go to register page" },
    { role: "user", pause: 500 },
    { role: "user", action: "fillRegistrationForm", data: users.fresh as any, description: "Fill registration form" },
    { role: "user", pause: 500 },
    { role: "user", action: "click", target: 'button[type="submit"]', description: "Submit registration" },
    { role: "user", action: "waitFor", target: "text=Equip Me", data: { state: "visible" }, description: "Wait for home page" },
    { role: "user", pause: 2000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = { fillRegistrationForm };
