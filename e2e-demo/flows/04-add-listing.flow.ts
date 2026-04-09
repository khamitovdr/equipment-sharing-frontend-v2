import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users, demoPhotos } from "../fixtures/seed-data.js";

const fillListingForm: ActionHandler = async (page) => {
  // Name
  await page.fill("#name", "Бульдозер Komatsu D65");
  await page.waitForTimeout(200);

  // Category — click the select trigger, then pick an option
  const categoryTrigger = page.locator('button[role="combobox"]').first();
  await categoryTrigger.click();
  await page.waitForTimeout(300);
  // Pick first available category option
  const option = page.locator('[role="option"]').first();
  await option.click();
  await page.waitForTimeout(200);

  // Price
  await page.fill("#price", "15000");
  await page.waitForTimeout(200);

  // Description
  await page.locator("textarea").fill(
    "Мощный бульдозер для земляных работ. Отличное техническое состояние.",
  );
  await page.waitForTimeout(200);
};

const addSpecifications: ActionHandler = async (page) => {
  // Click "Add specification" button
  const addBtn = page.locator("text=Add specification");
  await addBtn.click();
  await page.waitForTimeout(200);

  // Fill first spec
  const keyInputs = page.locator('input[placeholder="Name"]');
  const valueInputs = page.locator('input[placeholder="Value"]');
  await keyInputs.nth(0).fill("Мощность");
  await valueInputs.nth(0).fill("205 л.с.");
  await page.waitForTimeout(200);

  // Add second spec
  await addBtn.click();
  await page.waitForTimeout(200);
  await keyInputs.nth(1).fill("Вес");
  await valueInputs.nth(1).fill("20 500 кг");
  await page.waitForTimeout(200);
};

const toggleServiceFlags: ActionHandler = async (page) => {
  await page.locator("#delivery").check();
  await page.waitForTimeout(200);
  await page.locator("#with_operator").check();
  await page.waitForTimeout(200);
  await page.locator("#setup").check();
  await page.waitForTimeout(200);
};

const uploadPhotos: ActionHandler = async (page) => {
  const fileInput = page.locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]');
  await fileInput.setInputFiles([...demoPhotos]);
  // Wait for uploads to complete (polling for ready status)
  await page.waitForTimeout(5000);
};

const flow: FlowDefinition = {
  name: "04-add-listing",
  description: "Org admin creates a new equipment listing with photos and specs",
  roles: {
    orgAdmin: {
      auth: users.orgAdmin,
      startUrl: "/en/org/listings/new",
    },
  },
  steps: [
    { role: "orgAdmin", pause: 1000 },

    // Fill main form fields
    { role: "orgAdmin", action: "fillListingForm", description: "Fill listing name, category, price, description" },
    { role: "orgAdmin", pause: 500 },

    // Add specifications
    { role: "orgAdmin", action: "scroll", target: "text=Specifications", description: "Scroll to specs" },
    { role: "orgAdmin", action: "addSpecifications", description: "Add specification key-value pairs" },
    { role: "orgAdmin", pause: 500 },

    // Toggle service flags
    { role: "orgAdmin", action: "scroll", target: "text=Service options", description: "Scroll to service options" },
    { role: "orgAdmin", action: "toggleServiceFlags", description: "Enable delivery, operator, setup" },
    { role: "orgAdmin", pause: 500 },

    // Upload photos
    { role: "orgAdmin", action: "scroll", target: "text=Photos", description: "Scroll to photos" },
    { role: "orgAdmin", action: "uploadPhotos", description: "Upload 3 demo photos" },
    { role: "orgAdmin", pause: 500 },

    // Submit
    { role: "orgAdmin", action: "scroll", target: "body", description: "Scroll back to top" },
    { role: "orgAdmin", pause: 300 },
    { role: "orgAdmin", action: "click", target: 'button[type="submit"]', description: "Save listing" },
    { role: "orgAdmin", pause: 2000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = {
  fillListingForm,
  addSpecifications,
  toggleServiceFlags,
  uploadPhotos,
};
