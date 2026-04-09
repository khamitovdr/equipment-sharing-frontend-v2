import type { FlowDefinition, ActionHandler } from "../runner/types.js";
import { users } from "../fixtures/seed-data.js";

const searchAndInviteUser: ActionHandler = async (page, { data }) => {
  const email = String(data?.email ?? "");

  // Type email into user search input
  const searchInput = page.locator('input[placeholder="Search by email"]');
  await searchInput.click();
  await searchInput.type(email, { delay: 40 });
  await page.waitForTimeout(1500); // debounce + API call

  // Click the found user in results
  const userResult = page.locator("ul > li > button, [role='option']").first();
  await userResult.waitFor({ state: "visible", timeout: 5000 });
  await userResult.click();
  await page.waitForTimeout(500);

  // Select "Editor" role
  const roleSelect = page.locator("#role-select");
  await roleSelect.click();
  await page.waitForTimeout(200);
  const editorOption = page.locator('[role="option"]:has-text("Editor")');
  await editorOption.click();
  await page.waitForTimeout(300);

  // Submit invitation
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
};

const acceptInvitation: ActionHandler = async (page) => {
  await page.reload();
  await page.waitForTimeout(1000);

  const acceptBtn = page.locator("text=Accept").or(page.locator("text=Join"));
  await acceptBtn.waitFor({ state: "visible", timeout: 10_000 });
  await acceptBtn.click();
  await page.waitForTimeout(1000);
};

const flow: FlowDefinition = {
  name: "06-member-management",
  description: "Org admin invites a user by email, invitee accepts, admin sees new member",
  roles: {
    orgAdmin: {
      auth: users.orgAdmin,
      startUrl: "/en/org/members/invite",
    },
    invitee: {
      auth: users.invitee,
    },
  },
  steps: [
    // --- Both start ---
    { role: "orgAdmin", pause: 800 },
    { role: "invitee", action: "navigate", target: "/en", description: "Invitee at home page" },
    { sync: "ready" },

    // --- OrgAdmin invites the user ---
    { role: "orgAdmin", action: "searchAndInviteUser", data: { email: users.invitee.email }, description: "Search user by email and send invitation" },
    { role: "orgAdmin", pause: 500 },
    { sync: "invite-sent" },

    // --- Invitee accepts ---
    // Navigate to the org page (invitation may appear in org context)
    { role: "invitee", action: "navigate", target: "/en/organizations", description: "Invitee browses organizations" },
    { role: "invitee", pause: 800 },
    { role: "invitee", action: "acceptInvitation", description: "Accept the invitation" },
    { sync: "invite-accepted" },

    // --- OrgAdmin sees new member ---
    { role: "orgAdmin", action: "navigate", target: "/en/org/members", description: "Go to members list" },
    { role: "orgAdmin", action: "waitFor", target: `text=${users.invitee.name}`, description: "See new member in list" },
    { role: "orgAdmin", pause: 2000 },
    { role: "invitee", pause: 2000 },
  ],
};

export default flow;
export const actions: Record<string, ActionHandler> = {
  searchAndInviteUser,
  acceptInvitation,
};
