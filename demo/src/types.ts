import type { Marker, Vector } from "react-earth";
import type { OverlayToolBox, Projection } from "react-earth";

export type Config = {
  projection: Projection;
  param: FieldType;
};

export type ColorScaleBounds = {
  lowerBound: number;
  upperBound: number;
};

// ******************
// * Data types     *
// ******************

export type FieldType = "wind" | "temperature" | "current";

/**
 * Raw gridded meteorological data derived from a GRIB dataset.
 *
 * The dataset is represented as an array of grid components. The array contains:
 * - a single element when the field is scalar (e.g. temperature),
 * - two elements when the field is a vector field (e.g. wind), corresponding
 *   to the two vector components.
 *
 * Each element describes a regular latitude–longitude grid and contains both
 * the raw values and the metadata required to reconstruct the grid geometry.
 */
export type RawData = {
  /**
   * Flattened array of grid values.
   *
   * Values are stored in row-major order and correspond to a regular
   * longitude–latitude grid described by the header. The total number
   * of elements should be `nx * ny`.
   */
  data: number[];
  header: {
    /** Number of grid points along the longitude and latitude axis */
    nx: number;
    ny: number;
    /** Longitude and latitude of the first grid point (degrees) */
    lo1: number;
    la1: number;
    /** Grid spacing in the longitudinal and latitudinal direction (degrees) */
    dx: number;
    dy: number;
  };
}[];

export type ExtendedOverlayToolBox<T> = OverlayToolBox<T> & {
  dataType: FieldType;
  getScalarForOverlay: (λ: number, φ: number) => number | null;
};

export type ExtendedMarker = Marker & { type: FieldType } & (
    | {
        isScalar: true;
        type: "temperature";
        value: number;
      }
    | { isScalar: false; type: "wind" | "current"; value: Vector | null }
  );
