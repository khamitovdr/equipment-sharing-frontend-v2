import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users, org } from "../fixtures/seed-data.js";

const searchAndSelectOrg: ActionHandler = async (page) => {
  // Type INN into Dadata search input
  const searchInput = page.locator('input[placeholder="Enter organization name or INN"]');
  await searchInput.click();
  await searchInput.type(org.inn, { delay: 60 });

  // Wait for Dadata suggestions dropdown
  await page.waitForTimeout(1500); // Dadata has 300ms debounce + network

  // Click first suggestion
  const suggestion = page.locator("ul > li > button").first();
  await suggestion.waitFor({ state: "visible", timeout: 5000 });
  await suggestion.click();
  await page.waitForTimeout(500);
};

const fillContacts: ActionHandler = async (page) => {
  await page.fill('#contacts-0-display-name', "Отдел аренды");

  const phoneInput = page.locator('#contacts-0-phone');
  await phoneInput.click();
  await phoneInput.fill("+7 (495) 123-45-67");

  await page.fill('#contacts-0-email', "rent@demo-org.ru");
  await page.waitForTimeout(300);
};

const flow: FlowDefinition = {
  name: "03-create-organization",
  description: "User creates an organization via INN lookup with Dadata autofill",
  roles: {
    user: { auth: users.renter },
  },
  steps: [
    { role: "user", action: "navigate", target: "/en/organizations/new", description: "Go to create org page" },
    { role: "user", pause: 800 },

    // Search org by INN
    { role: "user", action: "searchAndSelectOrg", description: "Search org by INN and select from Dadata" },
    { role: "user", pause: 1000 },

    // Fill contacts
    { role: "user", action: "fillContacts", description: "Fill contact details" },
    { role: "user", pause: 500 },

    // Submit
    { role: "user", action: "click", target: 'button[type="submit"]', description: "Create organization" },
    { role: "user", action: "waitFor", target: "text=Listings", data: { state: "visible" }, description: "Wait for org dashboard" },
    { role: "user", pause: 2000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = { searchAndSelectOrg, fillContacts };
