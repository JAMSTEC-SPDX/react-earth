/** Restricts a value to lie within a given range, modeling physical bounds or limits */
export function clamp(x: number, low: number, high: number) {
  return Math.max(low, Math.min(x, high));
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

/** Computes the normalized position of a value within a range, representing its relative proportion between bounds */
export function proportion(x: number, low: number, high: number) {
  return (clamp(x, low, high) - low) / (high - low);
}
