import { useState, useMemo, useCallback } from "react";

import {
  bilinearInterpolateScalar,
  bilinearInterpolateVector,
  getScalarValue,
  getVectorValue,
  interpolateField,
  type VectorInterpolate,
} from "@jamstec-spdx/react-earth";

import type { ExtendedOverlayToolBox, FieldType, RawData } from "./types";
import { isScalar } from "./utils/fieldTypes";
import { isValue, magnitude } from "./utils/maths";

function interpolateVectorField(json: RawData) {
  const grid = json[0].header;

  if (json.length < 2) throw new Error("Vector data should have 2 components");

  const uData = json[0].data;
  const vData = json[1].data;
  const size = uData.length;
  const data = new Float32Array(size * 2);

  for (let i = 0; i < size; i++) {
    data[i] = uData[i] ?? NaN;
    data[size + i] = vData[i] ?? NaN;
  }

  return interpolateField(grid, {
    getValue: getVectorValue(data, grid),
    bilinearInterpolateFunc: bilinearInterpolateVector,
  });
}

// **************************
// * parseRawData           *
// **************************

function parseRawData(
  json: RawData,
  fieldType: FieldType,
): ExtendedOverlayToolBox {
  const grid = json[0].header;

  if (isScalar(fieldType)) {
    const data = Float32Array.from(json[0].data, (value) =>
      value === null ? NaN : value,
    );
    const interpolate = interpolateField(grid, {
      getValue: getScalarValue(data, grid),
      bilinearInterpolateFunc: bilinearInterpolateScalar,
    });

    return {
      grid,
      dataType: fieldType,
      overlayData: data,
      getScalarForOverlay: (λ: number, φ: number) => interpolate(λ, φ),
      interpolate,
    };
  }

  if (json.length < 2) throw new Error("Vector data should have 2 components");

  const uData = json[0].data;
  const vData = json[1].data;
  const overlayData = new Float32Array(uData.length);

  for (let i = 0; i < uData.length; i++) {
    const u = uData[i];
    const v = vData[i];

    overlayData[i] =
      !Number.isNaN(u) && !Number.isNaN(v) ? Math.sqrt(u * u + v * v) : NaN;
  }

  const interpolate = interpolateVectorField(json);

  return {
    grid,
    dataType: fieldType,
    overlayData,
    getScalarForOverlay: (λ: number, φ: number) => {
      const value = interpolate(λ, φ);
      return isValue(value) ? magnitude(value) : null;
    },
    interpolate,
  };
}

// **************************
// * useDataToolBox         *
// **************************

export default function useDataToolBox() {
  // overlayToolBox is undefined before the initial load and becomes null when no data is available.
  const [overlayToolBox, setOverlayToolBox] =
    useState<ExtendedOverlayToolBox | null>();
  const [streamInterpolate, setStreamInterpolate] =
    useState<VectorInterpolate | null>(null);

  const updateData = useCallback(async (param: FieldType) => {
    let overlayData: ExtendedOverlayToolBox | null = null;

    try {
      const filename = `${import.meta.env.BASE_URL}data/${param}_data.json`;
      const res = await fetch(filename);

      if (!res.ok) throw new Error(`Failed to load file: ${filename}`);
      const rawData = await res.json();

      overlayData = parseRawData(rawData, param);
    } catch (e) {
      console.error(e);
    }

    setOverlayToolBox(overlayData);

    setStreamInterpolate(
      overlayData?.dataType === "wind" || overlayData?.dataType === "current"
        ? () => overlayData.interpolate as VectorInterpolate
        : null,
    );
  }, []);

  return useMemo(
    () => ({ overlayToolBox, streamInterpolate, updateData }),
    [overlayToolBox, streamInterpolate, updateData],
  );
}
