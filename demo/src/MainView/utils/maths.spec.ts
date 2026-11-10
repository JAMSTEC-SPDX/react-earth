import { describe, it, expect } from "vitest";

import { floorMod, isValue } from "./maths";

describe("floorMod", () => {
  it("should return the correct value (positive and in [a, n))", () => {
    expect(floorMod(25, 6)).toBe(1);
    expect(floorMod(4, 6)).toBe(4);
    expect(floorMod(-11, 6)).toBe(1);
    expect(floorMod(12, 6)).toBe(0);
  });
});

describe("isValue", () => {
  it("should return the correct value", () => {
    expect(isValue(25)).toBe(true);
    expect(isValue(0)).toBe(true);
    expect(isValue(null)).toBe(false);
    expect(isValue(undefined)).toBe(false);
  });
});
