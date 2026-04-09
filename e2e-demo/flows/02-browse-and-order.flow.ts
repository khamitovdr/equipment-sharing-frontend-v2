import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users } from "../fixtures/seed-data.js";

const selectDatesAndOrder: ActionHandler = async (page) => {
  // The reservation calendar uses react-day-picker
  // Click two dates in the visible calendar to select a range
  const calendarDays = page.locator('button.rdp-day:not([disabled])');
  const count = await calendarDays.count();

  if (count < 2) {
    throw new Error("Not enough available dates in the calendar");
  }

  // Click start date (first available)
  await calendarDays.nth(0).click();
  await page.waitForTimeout(300);

  // Click end date (a few days later)
  const endIdx = Math.min(4, count - 1);
  await calendarDays.nth(endIdx).click();
  await page.waitForTimeout(500);
};

const applyCategoryFilter: ActionHandler = async (page) => {
  // Click the category filter to expand it, then pick the first option
  const categoryCheckbox = page.locator('[data-slot="checkbox"]').first();
  if (await categoryCheckbox.isVisible()) {
    await categoryCheckbox.click();
    await page.waitForTimeout(800);
  }
};

const flow: FlowDefinition = {
  name: "02-browse-and-order",
  description: "User browses catalog, views listing, and places a rental order",
  roles: {
    user: { auth: users.renter },
  },
  steps: [
    // Browse catalog
    { role: "user", action: "navigate", target: "/en/listings", description: "Open catalog" },
    { role: "user", pause: 1000 },

    // Apply a category filter
    { role: "user", action: "applyCategoryFilter", description: "Select a category to filter" },
    { role: "user", pause: 800 },

    { role: "user", action: "scroll", target: "bottom", description: "Scroll through filtered listings" },
    { role: "user", pause: 800 },
    { role: "user", action: "scroll", target: "body", description: "Scroll back to top" },
    { role: "user", pause: 500 },

    // Click first listing
    { role: "user", action: "click", target: "a[href*='/listings/']", description: "Click first listing" },
    { role: "user", action: "waitFor", target: "text=Request rental", description: "Wait for listing detail" },
    { role: "user", pause: 1000 },

    // Scroll to order form
    { role: "user", action: "scroll", target: "text=Select rental dates", description: "Scroll to calendar" },
    { role: "user", pause: 500 },

    // Select dates
    { role: "user", action: "selectDatesAndOrder", description: "Pick date range on calendar" },
    { role: "user", pause: 500 },

    // Submit order
    { role: "user", action: "click", target: "text=Request rental", description: "Submit rental request" },
    { role: "user", pause: 2000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = { selectDatesAndOrder, applyCategoryFilter };
