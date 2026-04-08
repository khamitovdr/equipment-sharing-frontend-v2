import { describe, it, expect } from "vitest";
import { contactSchema, orgCreateSchema, contactsReplaceSchema } from "../organization";

describe("contactSchema", () => {
  const validFull = {
    display_name: "John Doe",
    phone: "+7 (999) 123-45-67",
    email: "john@example.com",
  };

  it("accepts valid contact with all fields", () => {
    expect(contactSchema.safeParse(validFull).success).toBe(true);
  });

  it("accepts contact with only display_name", () => {
    expect(contactSchema.safeParse({ display_name: "John Doe" }).success).toBe(true);
  });

  it("accepts contact with empty phone string", () => {
    expect(contactSchema.safeParse({ display_name: "John Doe", phone: "" }).success).toBe(true);
  });

  it("accepts contact with empty email string", () => {
    expect(contactSchema.safeParse({ display_name: "John Doe", email: "" }).success).toBe(true);
  });

  it("rejects empty display_name", () => {
    expect(contactSchema.safeParse({ ...validFull, display_name: "" }).success).toBe(false);
  });

  it("rejects invalid phone format", () => {
    expect(contactSchema.safeParse({ ...validFull, phone: "89991234567" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(contactSchema.safeParse({ ...validFull, email: "not-an-email" }).success).toBe(false);
  });
});

describe("orgCreateSchema", () => {
  const validContact = { display_name: "John Doe" };

  it("accepts valid org with inn and contacts", () => {
    expect(
      orgCreateSchema.safeParse({ inn: "1234567890", contacts: [validContact] }).success
    ).toBe(true);
  });

  it("rejects missing inn", () => {
    expect(
      orgCreateSchema.safeParse({ inn: "", contacts: [validContact] }).success
    ).toBe(false);
  });

  it("rejects empty contacts array", () => {
    expect(
      orgCreateSchema.safeParse({ inn: "1234567890", contacts: [] }).success
    ).toBe(false);
  });
});

describe("contactsReplaceSchema", () => {
  const validContact = { display_name: "Jane Doe" };

  it("accepts valid contacts list", () => {
    expect(
      contactsReplaceSchema.safeParse({ contacts: [validContact] }).success
    ).toBe(true);
  });

  it("rejects empty contacts array", () => {
    expect(
      contactsReplaceSchema.safeParse({ contacts: [] }).success
    ).toBe(false);
  });
});
