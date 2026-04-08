import { describe, it, expect } from "vitest";
import { profileSchema, passwordChangeSchema } from "../settings";

describe("profileSchema", () => {
  const valid = {
    name: "Dmitry",
    surname: "Khamitov",
    middle_name: "",
    email: "dmitry@example.com",
    phone: "+7 (999) 123-45-67",
  };

  it("accepts valid profile data", () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects empty name", () => {
    expect(profileSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });
  it("rejects empty surname", () => {
    expect(profileSchema.safeParse({ ...valid, surname: "" }).success).toBe(false);
  });
  it("rejects invalid email", () => {
    expect(profileSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
  });
  it("rejects incorrectly formatted phone", () => {
    expect(profileSchema.safeParse({ ...valid, phone: "89991234567" }).success).toBe(false);
  });
  it("allows empty middle_name", () => {
    expect(profileSchema.safeParse({ ...valid, middle_name: "" }).success).toBe(true);
  });
});

describe("passwordChangeSchema", () => {
  const valid = {
    password: "oldPassword",
    new_password: "NewPass1",
    confirm_password: "NewPass1",
  };

  it("accepts valid password change", () => {
    expect(passwordChangeSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects empty current password", () => {
    expect(passwordChangeSchema.safeParse({ ...valid, password: "" }).success).toBe(false);
  });
  it("rejects weak new password", () => {
    expect(passwordChangeSchema.safeParse({ ...valid, new_password: "weak", confirm_password: "weak" }).success).toBe(false);
  });
  it("rejects mismatched confirm password", () => {
    expect(passwordChangeSchema.safeParse({ ...valid, confirm_password: "Different1" }).success).toBe(false);
  });
});
