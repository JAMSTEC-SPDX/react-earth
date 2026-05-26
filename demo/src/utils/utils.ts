import { useEffect } from "react";

import type { ColorScaleBounds, Vector } from "@jamstec-spdx/react-earth";

import type {
  ExtendedOverlayToolBox,
  ExtendedMarker,
  ColorScaleBoundsInput,
} from "@/types";

/** Executes the callback after the value changes and the specified delay has elapsed */
export const useDebounceFunc = <T = string | number>(
  value: T,
  debounceCallback: (debouncedValue: T) => void,
  delay: number,
) => {
  useEffect(() => {
    const handler = setTimeout(() => {
      debounceCallback(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, debounceCallback]);
};

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

export function colorScaleBoundToInputs(
  colorScaleBounds: ColorScaleBounds,
): ColorScaleBoundsInput {
  return {
    lowerBound: `${colorScaleBounds.lowerBound}`,
    upperBound: `${colorScaleBounds.upperBound}`,
  };
}
