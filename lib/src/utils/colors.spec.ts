import { describe, it, expect } from "vitest";

import { getSegmentedColorScaleFunction } from "./colors";

describe("segmentedColorScale", () => {
  it("should return the correct interpolated color", () => {
    const segmentedColorScaleFunc = getSegmentedColorScaleFunction([
      { bound: 0, color: [255, 0, 0] },
      { bound: 10, color: [0, 255, 0] },
      { bound: 20, color: [0, 0, 255] },
    ]);

    expect(segmentedColorScaleFunc(-10, 1)).toStrictEqual([255, 0, 0, 1]);
    expect(segmentedColorScaleFunc(0, 1)).toStrictEqual([255, 0, 0, 1]);
    expect(segmentedColorScaleFunc(5, 1)).toStrictEqual([127, 127, 0, 1]);
    expect(segmentedColorScaleFunc(10, 1)).toStrictEqual([0, 255, 0, 1]);
    expect(segmentedColorScaleFunc(12, 1)).toStrictEqual([0, 204, 51, 1]);
    expect(segmentedColorScaleFunc(20, 1)).toStrictEqual([0, 0, 255, 1]);
    expect(segmentedColorScaleFunc(23, 1)).toStrictEqual([0, 0, 255, 1]);
  });
});
