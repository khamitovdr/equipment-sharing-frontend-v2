import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../auth";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "Password1!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    name: "Ivan",
    surname: "Petrov",
    email: "ivan@example.com",
    phone: "+79991234567",
    password: "Password1!",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts optional middle_name", () => {
    const result = registerSchema.safeParse({
      ...validData,
      middle_name: "Sergeevich",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid Russian phone", () => {
    const result = registerSchema.safeParse({
      ...validData,
      phone: "1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});
