import Earth from "./Earth";

// useful helper for creating a color scale
export {
  getSegmentedColorScaleFunction,
  type ColorSegment,
  type RGBAColor,
} from "./utils/colors";

export { default as GlobeController } from "./GlobeController";

export type { Marker, Vector, Projection, View, OverlayToolBox } from "./types";

// useful helpers for formatting raw data into the format expected by this library
export {
  default as interpolateField,
  bilinearInterpolateScalar,
  bilinearInterpolateVector,
} from "./interpolateField";

export default Earth;
