import { describe, it, expect } from "vitest";
import { formatPhone, extractDigits } from "../phone";

describe("extractDigits", () => {
  it("strips non-digit characters", () => {
    expect(extractDigits("+7 (999) 123-45-67")).toBe("79991234567");
  });
  it("returns empty string for empty input", () => {
    expect(extractDigits("")).toBe("");
  });
});

describe("formatPhone", () => {
  it("formats 8 as +7", () => { expect(formatPhone("8")).toBe("+7"); });
  it("formats 9 as +7 (9", () => { expect(formatPhone("9")).toBe("+7 (9"); });
  it("formats +7 as +7", () => { expect(formatPhone("+7")).toBe("+7"); });
  it("formats 89991234567 as +7 (999) 123-45-67", () => { expect(formatPhone("89991234567")).toBe("+7 (999) 123-45-67"); });
  it("formats raw digits 9991234567 as +7 (999) 123-45-67", () => { expect(formatPhone("9991234567")).toBe("+7 (999) 123-45-67"); });
  it("formats partial input +7999 as +7 (999", () => { expect(formatPhone("+7999")).toBe("+7 (999"); });
  it("formats partial input +79991 as +7 (999) 1", () => { expect(formatPhone("+79991")).toBe("+7 (999) 1"); });
  it("formats partial input +7999123 as +7 (999) 123", () => { expect(formatPhone("+7999123")).toBe("+7 (999) 123"); });
  it("formats partial input +79991234 as +7 (999) 123-4", () => { expect(formatPhone("+79991234")).toBe("+7 (999) 123-4"); });
  it("formats partial input +799912345 as +7 (999) 123-45", () => { expect(formatPhone("+799912345")).toBe("+7 (999) 123-45"); });
  it("formats partial input +7999123456 as +7 (999) 123-45-6", () => { expect(formatPhone("+7999123456")).toBe("+7 (999) 123-45-6"); });
  it("truncates digits beyond 11 total", () => { expect(formatPhone("+799912345678")).toBe("+7 (999) 123-45-67"); });
  it("handles already formatted input", () => { expect(formatPhone("+7 (999) 123-45-67")).toBe("+7 (999) 123-45-67"); });
  it("returns empty string for empty input", () => { expect(formatPhone("")).toBe(""); });
  it("handles 79991234567", () => { expect(formatPhone("79991234567")).toBe("+7 (999) 123-45-67"); });
});
