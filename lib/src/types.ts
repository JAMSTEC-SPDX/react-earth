// ***************************
// * Configuration types     *
// ***************************

export type Vector = [number, number];

export type Projection = "ortho" | "equirectangular";

// ******************
// * View types     *
// ******************

export type View = { height: number; width: number };

export type ViewBounds = {
  x: number;
  y: number;
  xMax: number;
  yMax: number;
  width: number;
  height: number;
};

// ******************
// * Data types     *
// ******************

export type OverlayToolBox<T> = {
  grid: {
    /** Number of grid points along the longitude and latitude axis */
    nx: number;
    ny: number;
    /** Longitude and latitude of the first grid point (degrees) */
    lon0: number;
    lat0: number;
    /** Grid spacing in the longitudinal and latitudinal direction (degrees) */
    dx: number;
    dy: number;
  };
  overlayData: (number | null)[];
  interpolate: (λ: number, φ: number) => T | null;
};

export type BilinearInterpolatedGrid<T> = {
  data: (T | null)[];
  bilinearInterpolateFunc: (
    x: number,
    y: number,
    g00: T,
    g10: T,
    g01: T,
    g11: T,
  ) => T;
};

// ******************
// * Vector types   *
// ******************

// Vectors may represent physical flows such as winds or ocean currents

export type VectorValue = [number, number, number | null];
export type VectorField = VectorValue[][];
