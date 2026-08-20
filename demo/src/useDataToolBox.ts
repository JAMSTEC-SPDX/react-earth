import { useState, useEffect, useMemo, useRef } from "react";

import {
  bilinearInterpolateScalar,
  bilinearInterpolateVector,
  getScalarValue,
  getVectorValue,
  interpolateField,
  type Vector,
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
): ExtendedOverlayToolBox<number> | ExtendedOverlayToolBox<Vector> {
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

export default function useDataToolBox(param: FieldType) {
  const overlayToolBoxRef = useRef<
    ExtendedOverlayToolBox<Vector> | ExtendedOverlayToolBox<number> | null
  >(null);
  const [overlayVersion, setOverlayVersion] = useState(0);
  const [fieldType, setFieldType] = useState<FieldType>("wind");
  const [error, setError] = useState(false);
  const [streamInterpolate, setStreamInterpolate] = useState<
    ((λ: number, φ: number) => Vector | null) | null
  >(null);

  const fetchData = async (param: FieldType) => {
    const filename = `${import.meta.env.BASE_URL}data/${param}_data.json`;
    const res = await fetch(filename);
    if (!res.ok) throw new Error(`Failed to load file: ${filename}`);
    return res.json();
  };

  useEffect(() => {
    const fetchOverlayData = async (param: FieldType) => {
      try {
        const rawData = await fetchData(param);
        return parseRawData(rawData, param);
      } catch (e) {
        console.error(e);
        return null;
      }
    };

    const updateOverlay = async () => {
      setError(false);
      const overlayData = await fetchOverlayData(param);
      overlayToolBoxRef.current = overlayData;

      if (
        overlayData?.dataType === "wind" ||
        overlayData?.dataType === "current"
      ) {
        setStreamInterpolate(
          () =>
            overlayData.interpolate as (λ: number, φ: number) => Vector | null,
        );
      } else {
        setStreamInterpolate(null);
      }

      setFieldType(overlayData?.dataType ?? "wind");
      setError(overlayData === null);
      setOverlayVersion((prev) => prev + 1);
    };

    updateOverlay();
  }, [param]);

  return useMemo(
    () => ({
      overlayVersion,
      overlayToolBoxRef,
      fieldType,
      error,
      streamInterpolate,
    }),
    [overlayVersion, fieldType, error, streamInterpolate],
  );
}
