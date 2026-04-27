import { TRANSPARENT_BLACK } from "../consts";
import { proportion } from "./maths";

export type RGBColor = [number, number, number];
export type RGBAColor = [number, number, number, number];
export type ColorSegment = { bound: number; color: RGBColor };

function colorInterpolator(start: RGBColor, end: RGBColor) {
  const [r, g, b] = start;
  const Δr = end[0] - r,
    Δg = end[1] - g,
    Δb = end[2] - b;
  return function (i: number, a: number): RGBAColor {
    return [
      Math.floor(r + i * Δr),
      Math.floor(g + i * Δg),
      Math.floor(b + i * Δb),
      a,
    ];
  };
}

/**
 * Creates and returns a segmented color scale function that maps a numeric value to an interpolated RGBA color based
 * on defined bounds, smoothly blending between adjacent segment colors and applying the specified alpha value.
 *
 * For example, the following creates a scale that smoothly transitions from red to green to blue along the
 * points 0.5, 1.0, and 3.5:
 *
 *     [ { bound: 0.5, color: [255, 0, 0] },
 *       { bound: 1.0, color: [0, 255, 0] },
 *       { bound: 3.5, color: [0, 0, 255] }, ]
 */
export const getSegmentedColorScaleFunction = (segments: ColorSegment[]) => {
  return function (value: number, alpha = 1): RGBAColor {
    const i = segments.findIndex((segment) => value < segment.bound);

    if (i === 0) return [...segments.at(0)!.color, alpha];
    if (i === -1 || i === segments.length)
      return [...segments.at(-1)!.color, alpha];

    const lowerSegment = segments[i - 1];
    const upperSegment = segments[i];

    const interpolator = colorInterpolator(
      lowerSegment.color,
      upperSegment.color,
    );
    return interpolator(
      proportion(value, lowerSegment.bound, upperSegment.bound),
      alpha,
    );
  };
};

export function setPixelColor(
  colorData: Float32Array<ArrayBuffer>,
  i: number,
  color: RGBAColor,
) {
  const [r, g, b] = color;
  colorData[i * 4] = r / 255;
  colorData[i * 4 + 1] = g / 255;
  colorData[i * 4 + 2] = b / 255;
  colorData[i * 4 + 3] = color === TRANSPARENT_BLACK ? 0 : 0.4;
}
