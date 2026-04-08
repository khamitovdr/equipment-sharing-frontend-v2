import { describe, it, expect } from "vitest";
import { listingSchema } from "../listing";

describe("listingSchema", () => {
  const validMinimal = {
    name: "Excavator",
    category_id: "cat-123",
    price: 1000,
  };

  it("accepts valid listing with required fields", () => {
    expect(listingSchema.safeParse(validMinimal).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(listingSchema.safeParse({ ...validMinimal, name: "" }).success).toBe(false);
  });

  it("rejects zero price", () => {
    expect(listingSchema.safeParse({ ...validMinimal, price: 0 }).success).toBe(false);
  });

  it("rejects negative price", () => {
    expect(listingSchema.safeParse({ ...validMinimal, price: -100 }).success).toBe(false);
  });

  it("accepts listing with all optional fields", () => {
    const full = {
      ...validMinimal,
      description: "A large excavator",
      specifications: { weight: "20t", reach: "10m" },
      with_operator: true,
      on_owner_site: false,
      delivery: true,
      installation: false,
      setup: true,
      photo_ids: ["photo1", "photo2"],
    };
    expect(listingSchema.safeParse(full).success).toBe(true);
  });

  it("rejects more than 10 photos", () => {
    const tooManyPhotos = Array.from({ length: 11 }, (_, i) => `photo${i}`);
    expect(
      listingSchema.safeParse({ ...validMinimal, photo_ids: tooManyPhotos }).success
    ).toBe(false);
  });

  it("accepts exactly 10 photos", () => {
    const tenPhotos = Array.from({ length: 10 }, (_, i) => `photo${i}`);
    expect(
      listingSchema.safeParse({ ...validMinimal, photo_ids: tenPhotos }).success
    ).toBe(true);
  });
});
