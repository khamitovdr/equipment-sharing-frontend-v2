import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users, listings } from "../fixtures/seed-data.js";

const selectDatesAndOrder: ActionHandler = async (page) => {
  const calendarDays = page.locator('button.rdp-day:not([disabled])');
  const count = await calendarDays.count();
  if (count < 2) throw new Error("Not enough available dates");

  await calendarDays.nth(0).click();
  await page.waitForTimeout(300);
  await calendarDays.nth(Math.min(4, count - 1)).click();
  await page.waitForTimeout(500);
};

const makeOffer: ActionHandler = async (page) => {
  // Click "Make offer" button
  const makeOfferBtn = page.locator("text=Make offer").first();
  await makeOfferBtn.click();
  await page.waitForTimeout(500);

  // Fill offer form
  await page.fill("#offered_cost", "12000");
  await page.waitForTimeout(200);

  // Submit offer
  const sendBtn = page.locator("text=Send offer");
  await sendBtn.click();
  await page.waitForTimeout(1000);
};

const acceptOffer: ActionHandler = async (page) => {
  // Reload to see updated status
  await page.reload();
  await page.waitForTimeout(1000);

  const acceptBtn = page.locator("text=Accept offer");
  await acceptBtn.waitFor({ state: "visible", timeout: 10_000 });
  await acceptBtn.click();
  await page.waitForTimeout(1000);
};

const approveOrder: ActionHandler = async (page) => {
  // Reload to see updated status
  await page.reload();
  await page.waitForTimeout(1000);

  const approveBtn = page.locator("text=Approve");
  await approveBtn.waitFor({ state: "visible", timeout: 10_000 });
  await approveBtn.click();
  await page.waitForTimeout(1000);
};

const flow: FlowDefinition = {
  name: "05-order-lifecycle",
  description: "Full order lifecycle: user places order, org makes offer, user accepts, org approves",
  roles: {
    user: { auth: users.renter },
    orgAdmin: { auth: users.orgAdmin },
  },
  steps: [
    // --- Both login and arrive at starting positions ---
    { role: "user", action: "navigate", target: "/en/listings", description: "User opens catalog" },
    { role: "orgAdmin", action: "navigate", target: "/en/org/orders", description: "OrgAdmin opens orders dashboard" },
    { sync: "ready" },
    { role: "user", pause: 500 },
    { role: "orgAdmin", pause: 500 },

    // --- User places order ---
    { role: "user", action: "click", target: "a[href*='/listings/']", description: "User clicks first listing" },
    { role: "user", action: "waitFor", target: "text=Request rental", description: "Wait for listing detail" },
    { role: "user", pause: 500 },
    { role: "user", action: "scroll", target: "text=Select rental dates", description: "Scroll to calendar" },
    { role: "user", pause: 500 },
    { role: "user", action: "selectDatesAndOrder", description: "Pick dates" },
    { role: "user", pause: 300 },
    { role: "user", action: "click", target: "text=Request rental", description: "Submit order" },
    { role: "user", pause: 1000 },

    // Navigate to user's orders to watch status
    { role: "user", action: "navigate", target: "/en/orders", description: "User goes to My Orders" },
    { role: "user", action: "waitFor", target: "text=Pending", description: "See pending order" },
    { role: "user", pause: 500 },
    // Click into the order detail
    { role: "user", action: "click", target: "tr:has(text=Pending)", description: "Open order detail" },
    { role: "user", pause: 500 },
    { sync: "order-placed" },

    // --- OrgAdmin sees new order and makes offer ---
    { role: "orgAdmin", action: "navigate", target: "/en/org/orders", description: "Refresh orders list" },
    { role: "orgAdmin", action: "waitFor", target: "text=Pending", description: "See incoming order" },
    { role: "orgAdmin", pause: 500 },
    { role: "orgAdmin", action: "click", target: "tr:has(text=Pending)", description: "Open order detail" },
    { role: "orgAdmin", pause: 800 },
    { role: "orgAdmin", action: "makeOffer", description: "Fill and submit counter-offer" },
    { sync: "offer-made" },

    // --- User accepts the offer ---
    { role: "user", action: "acceptOffer", description: "Reload and accept the offer" },
    { sync: "offer-accepted" },

    // --- OrgAdmin approves ---
    { role: "orgAdmin", action: "approveOrder", description: "Reload and approve the order" },
    { sync: "confirmed" },

    // --- Both see final state ---
    { role: "user", action: "navigate", target: "/en/orders", description: "User views final state" },
    { role: "user", pause: 1500 },
    { role: "orgAdmin", pause: 1500 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = {
  selectDatesAndOrder,
  makeOffer,
  acceptOffer,
  approveOrder,
};
