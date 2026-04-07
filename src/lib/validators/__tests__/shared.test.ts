import { describe, it, expect } from "vitest";
import { passwordSchema } from "../shared";

describe("passwordSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("Aa1xxxx");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without a lowercase letter", () => {
    const result = passwordSchema.safeParse("AAAAAAAA1");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without an uppercase letter", () => {
    const result = passwordSchema.safeParse("aaaaaaaa1");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without a digit", () => {
    const result = passwordSchema.safeParse("Aaaaaaaaa");
    expect(result.success).toBe(false);
  });

  it("accepts valid password with Latin letters", () => {
    const result = passwordSchema.safeParse("Password1");
    expect(result.success).toBe(true);
  });

  it("accepts valid password with Cyrillic letters", () => {
    const result = passwordSchema.safeParse("Парольчик1");
    expect(result.success).toBe(true);
  });

  it("accepts mixed Latin and Cyrillic", () => {
    const result = passwordSchema.safeParse("Паrolь1xx");
    expect(result.success).toBe(true);
  });

  it("recognises Cyrillic ё as lowercase", () => {
    const result = passwordSchema.safeParse("ПАРОЛЬё1");
    expect(result.success).toBe(true);
  });

  it("recognises Cyrillic Ё as uppercase", () => {
    const result = passwordSchema.safeParse("парольЁ1x");
    expect(result.success).toBe(true);
  });
});
