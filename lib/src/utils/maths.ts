import type { Vector } from "../types";

/** Restricts a value to lie within a given range, modeling physical bounds or limits */
export function clamp(x: number, low: number, high: number) {
  return Math.max(low, Math.min(x, high));
}

/** Ensures a valid numeric value, falling back when the input is not a finite or usable number */
export function ensureNumber(num: number, fallback: number) {
  return isFinite(num) || num === Infinity || num === -Infinity
    ? num
    : fallback;
}

/** Returns the positive modulo of a by n. */
export function floorMod(a: number, n: number) {
  const m = a - n * Math.floor(a / n);
  return m === n ? 0 : m;
}

/** Returns true if the specified value is not null and not undefined. */
export function isValue<T>(x: T | null | undefined) {
  return x !== null && x !== undefined;
}

/** Computes the magnitude (speed) of a 2D vector from its components, representing its physical intensity or strength */
export function magnitude(vector: Vector) {
  const [u, v] = vector;
  return Math.sqrt(u * u + v * v);
}

/** Computes the normalized position of a value within a range, representing its relative proportion between bounds */
export function proportion(x: number, low: number, high: number) {
  return (clamp(x, low, high) - low) / (high - low);
}

/** Returns a random integer in [min, max]. */
export function random(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
