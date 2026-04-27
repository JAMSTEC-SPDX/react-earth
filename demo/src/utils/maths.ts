import type { Vector } from "react-earth";

/** Returns the positive modulo of a by n. */
export function floorMod(a: number, n: number) {
  const m = a - n * Math.floor(a / n);
  return m === n ? 0 : m;
}

/** Returns true if the specified value is not null and not undefined. */
export function isValue<T>(x: T | null | undefined) {
  return x !== null && x !== undefined;
}

/** Computes a linear interpolation between two values, representing a smooth transition proportional to t between min and max */
export function linearInterpolate(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

/** Computes the magnitude (speed) of a 2D vector from its components, representing its physical intensity or strength */
export function magnitude(vector: Vector) {
  const [u, v] = vector;
  return Math.sqrt(u * u + v * v);
}
