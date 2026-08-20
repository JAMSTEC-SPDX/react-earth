import type { BilinearInterpolatedGrid, OverlayToolBox, Vector } from "./types";
import { floorMod } from "./utils/maths";

// **************************
// * Scalar data
// **************************

export function getScalarValue(
  data: Float32Array,
  gridSettings: OverlayToolBox<number>["grid"],
): (i: number, j: number) => number | null {
  const { dx: Δλ } = gridSettings; // distance between points on the longitude axis (degree)
  const { nx: ni, ny: nj } = gridSettings; // number of grid points W-E and N-S (e.g., 144 x 73)
  const isContinuous = Math.floor(ni * Δλ) >= 360;

  return function (i: number, j: number) {
    const wrappedI = isContinuous && i === ni ? 0 : i;
    if (j < 0 || j >= nj || wrappedI < 0 || wrappedI >= ni) return null;
    const value = data[j * ni + wrappedI];
    return Number.isNaN(value) ? null : value;
  };
}

export function bilinearInterpolateScalar(
  x: number,
  y: number,
  g00: number,
  g10: number,
  g01: number,
  g11: number,
) {
  const rx = 1 - x;
  const ry = 1 - y;
  return g00 * rx * ry + g10 * x * ry + g01 * rx * y + g11 * x * y;
}

// **************************
// * Vector data
// **************************

export function getVectorValue(
  data: Float32Array,
  gridSettings: OverlayToolBox<Vector>["grid"],
): (i: number, j: number) => Vector | null {
  const { dx: Δλ } = gridSettings; // distance between points on the longitude axis (degree)
  const { nx: ni, ny: nj } = gridSettings; // number of grid points W-E and N-S (e.g., 144 x 73)
  const isContinuous = Math.floor(ni * Δλ) >= 360;
  const offset = ni * nj;

  return function (i: number, j: number) {
    const wrappedI = isContinuous && i === ni ? 0 : i;
    if (j < 0 || j >= nj || wrappedI < 0 || wrappedI >= ni) return null;

    const index = j * ni + wrappedI;

    const u = data[index];
    const v = data[offset + index];

    return Number.isNaN(u) || Number.isNaN(v) ? null : [u, v];
  };
}

export function bilinearInterpolateVector(
  x: number,
  y: number,
  g00: Vector,
  g10: Vector,
  g01: Vector,
  g11: Vector,
): Vector {
  const rx = 1 - x;
  const ry = 1 - y;
  const a = rx * ry,
    b = x * ry,
    c = rx * y,
    d = x * y;
  const u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
  const v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
  return [u, v];
}

/** For grid settings and a bilinear interpolated grid, returns the interpolation function on the data. */
export default function interpolateField<T>(
  gridSettings: OverlayToolBox<T>["grid"],
  { getValue, bilinearInterpolateFunc }: BilinearInterpolatedGrid<T>,
) {
  const { lon0: λ0, lat0: φ0 } = gridSettings; // the grid's origin (e.g., 0.0E, 90.0N)
  const { dx: Δλ, dy: Δφ } = gridSettings; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)
  const { ny: nj } = gridSettings; // number of grid points W-E and N-S (e.g., 144 x 73)

  const latMin = Math.min(φ0, φ0 - (nj - 1) * Δφ);
  const latMax = Math.max(φ0, φ0 - (nj - 1) * Δφ);

  function interpolate(λ: number, φ: number) {
    if (φ < latMin || φ > latMax) return null;

    const i = floorMod(λ - λ0, 360) / Δλ; // calculate longitude index in wrapped range [0, 360)
    const j = (φ0 - φ) / Δφ; // calculate latitude index in direction +90 to -90

    //         1      2            After converting λ and φ to fractional grid indexes i and j, we find the
    //        fi  i   fi+1         four points "G" that enclose point (i, j). These points are at the four
    //         | =1.4 |            corners specified by the floor and ceiling of i and j. For example, given
    //      ---G--|---G--- fj   8  i = 1.4 and j = 8.3, the four surrounding grid points are (1, 8), (2, 8),
    //    j ___|_ .   |            (1, 9) and (2, 9).
    //  =8.3   |      |
    //      ---G------G--- fj+1 9  Note that for wrapped grids, the first column is duplicated as the last
    //         |      |            column, so the index ci can be used without taking a modulo.

    const fi = Math.floor(i);
    const fj = Math.floor(j);

    const g00 = getValue(fi, fj);
    const g10 = getValue(fi + 1, fj);
    const g01 = getValue(fi, fj + 1);
    const g11 = getValue(fi + 1, fj + 1);

    if (g00 == null || g10 == null || g01 == null || g11 == null) return null;

    return bilinearInterpolateFunc(i - fi, j - fj, g00, g10, g01, g11);
  }

  return interpolate;
}
