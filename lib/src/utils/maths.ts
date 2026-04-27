/** Returns the positive modulo of a by n. */
export function floorMod(a: number, n: number) {
  const m = a - n * Math.floor(a / n);
  return m === n ? 0 : m;
}
