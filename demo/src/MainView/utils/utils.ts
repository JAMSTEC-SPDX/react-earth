import { useEffect } from "react";

import type { ColorScaleBounds, Vector } from "@jamstec-spdx/react-earth";

import type {
  ExtendedMarker,
  ColorScaleBoundsInput,
  ExtendedOverlayToolBox,
  FieldType,
  RawData,
} from "../types";
import { isScalar } from "./fieldTypes";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
};

export function getMarkerData(
  λ: number,
  φ: number,
  overlayToolBox: ExtendedOverlayToolBox | null,
): ExtendedMarker | undefined {
  if (!overlayToolBox) return undefined;

  const { dataType, getScalarForOverlay, interpolate } = overlayToolBox;
  if (dataType == "invalid_dataset") return undefined;

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

export function isValidRawData(
  value: unknown,
  fieldType: FieldType,
): value is RawData {
  if (!Array.isArray(value)) return false;

  const expectedLength = isScalar(fieldType) ? 1 : 2;
  if (value.length !== expectedLength) return false;

  return value.every((item) => {
    if (typeof item !== "object" || item === null) return false;

    if (
      !Array.isArray(item.data) ||
      !item.data.every((n: unknown) => n === null || typeof n === "number")
    ) {
      return false;
    }

    const h = item.header;
    if (typeof h !== "object" || h === null) return false;

    return (
      typeof h.nx === "number" &&
      typeof h.ny === "number" &&
      typeof h.lon0 === "number" &&
      typeof h.lat0 === "number" &&
      typeof h.dx === "number" &&
      typeof h.dy === "number"
    );
  });
}
