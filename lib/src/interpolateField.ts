import type { BilinearInterpolatedGrid, OverlayToolBox, Vector } from "./types";
import { floorMod, isValue } from "./utils/maths";

// **************************
// * Scalar data
// **************************

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
  { data, bilinearInterpolateFunc }: BilinearInterpolatedGrid<T>,
) {
  const { lon0: λ0, lat0: φ0 } = gridSettings; // the grid's origin (e.g., 0.0E, 90.0N)
  const { dx: Δλ, dy: Δφ } = gridSettings; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)
  const { nx: ni, ny: nj } = gridSettings; // number of grid points W-E and N-S (e.g., 144 x 73)

  // 1. transform the raw data in grid lon/lat
  // Scan mode 0 assumed. Longitude increases from λ0, and latitude decreases from φ0.
  // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml
  const grid: (T | null)[][] = [];
  let p = 0;
  const isContinuous = Math.floor(ni * Δλ) >= 360;
  for (let j = 0; j < nj; j++) {
    const row: (T | null)[] = [];
    for (let i = 0; i < ni; i++, p++) {
      row.push(data[p]);
    }
    if (isContinuous) {
      row.push(row[0]);
    }
    grid[j] = row;
  }

  // 2. create interpolation function
  function interpolate(λ: number, φ: number) {
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

    if (grid[fj] && grid[fj + 1]) {
      const g00 = grid[fj][fi];
      const g10 = grid[fj][fi + 1];
      const g01 = grid[fj + 1][fi];
      const g11 = grid[fj + 1][fi + 1];
      if ([g00, g01, g10, g11].every(isValue)) {
        return bilinearInterpolateFunc(i - fi, j - fj, g00!, g10!, g01!, g11!);
      }
    }
    return null;
  }

  return interpolate;
}
