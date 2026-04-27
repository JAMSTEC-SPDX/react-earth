import { describe, it, expect } from "vitest";

import { floorMod } from "./maths";

describe("floorMod", () => {
  it("should return the correct value (positive and in [a, n))", () => {
    expect(floorMod(25, 6)).toBe(1);
    expect(floorMod(4, 6)).toBe(4);
    expect(floorMod(-11, 6)).toBe(1);
    expect(floorMod(12, 6)).toBe(0);
  });
});
