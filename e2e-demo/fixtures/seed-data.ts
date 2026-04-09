/**
 * Pre-seeded test data. Update these values to match
 * the accounts/data available on your target environment.
 *
 * Run against: DEMO_BASE_URL (default http://localhost:3000)
 */

export const users = {
  /** Regular user for renting equipment */
  renter: {
    email: "demo-renter@equip-me.ru",
    password: "DemoRenter123",
    name: "Алексей",
    surname: "Петров",
  },
  /** Org admin with an existing organization */
  orgAdmin: {
    email: "demo-admin@equip-me.ru",
    password: "DemoAdmin123",
    name: "Мария",
    surname: "Иванова",
  },
  /** User who will be invited to org (not yet a member) */
  invitee: {
    email: "demo-invitee@equip-me.ru",
    password: "DemoInvitee123",
    name: "Дмитрий",
    surname: "Козлов",
  },
  /** Fresh user for registration flow (NOT pre-seeded — created during flow) */
  fresh: {
    email: "demo-fresh@equip-me.ru",
    password: "DemoFresh123",
    name: "Иван",
    surname: "Сидоров",
    phone: "+7 (999) 123-45-67",
  },
} as const;

export const org = {
  /** Pre-seeded org owned by orgAdmin */
  id: "REPLACE_WITH_ACTUAL_ORG_ID",
  name: "ООО Демо Техника",
  inn: "7707083893",
} as const;

export const listings = {
  /** A published listing in the pre-seeded org, used for order flows */
  forOrder: {
    id: "REPLACE_WITH_ACTUAL_LISTING_ID",
    name: "Экскаватор CAT 320",
  },
} as const;

/** Demo photos for listing creation flow */
export const demoPhotos = [
  "e2e-demo/fixtures/assets/demo-photo-1.jpg",
  "e2e-demo/fixtures/assets/demo-photo-2.jpg",
  "e2e-demo/fixtures/assets/demo-photo-3.jpg",
] as const;

/** Demo avatar for registration flow */
export const demoAvatar = "e2e-demo/fixtures/assets/demo-avatar.jpg";
