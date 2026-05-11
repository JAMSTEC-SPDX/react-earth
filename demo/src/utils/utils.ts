import type { Vector } from "react-earth";

import type { ExtendedOverlayToolBox, ExtendedMarker } from "@/types";

export function getMarkerData(
  λ: number,
  φ: number,
  overlayToolBox:
    | ExtendedOverlayToolBox<Vector>
    | ExtendedOverlayToolBox<number>,
): ExtendedMarker {
  const { dataType, getScalarForOverlay, interpolate } = overlayToolBox;
  return {
    lon: λ,
    lat: φ,
    ...(dataType === "temperature"
      ? {
          isScalar: true,
          type: dataType,
          value: getScalarForOverlay(λ, φ) || 0,
        }
      : {
          isScalar: false,
          type: dataType,
          value: interpolate(λ, φ) as Vector | null,
        }),
  };
}
