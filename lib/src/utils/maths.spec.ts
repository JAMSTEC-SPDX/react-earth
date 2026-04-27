import { describe, it, expect } from "vitest";

import { clamp, ensureNumber, floorMod, isValue, proportion } from "./maths";

describe("clamp", () => {
  it("should return the clamped value", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("ensureNumber", () => {
  it("should return the correct value", () => {
    expect(ensureNumber(25, 20)).toBe(25);
    expect(ensureNumber(Infinity, 20)).toBe(Infinity);
    expect(ensureNumber(-Infinity, 20)).toBe(-Infinity);
  });
});

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

describe("proportion", () => {
  it("should return the correct value", () => {
    expect(proportion(25, 20, 30)).toBe(0.5);
    expect(proportion(22, 20, 30)).toBe(0.2);
    expect(proportion(20, 20, 30)).toBe(0);
    expect(proportion(31, 20, 30)).toBe(1);
  });
});
