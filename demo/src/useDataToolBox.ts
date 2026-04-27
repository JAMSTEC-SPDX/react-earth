import { useState, useEffect, useMemo } from "react";

import {
  bilinearInterpolateScalar,
  bilinearInterpolateVector,
  interpolateField,
  type Vector,
} from "react-earth";

import type { ExtendedOverlayToolBox, FieldType, RawData } from "./types";
import { isScalar } from "./utils/fieldTypes";
import { isValue, magnitude } from "./utils/maths";

function interpolateVectorField(json: RawData) {
  const grid = {
    nx: json[0].header.nx,
    ny: json[0].header.ny,
    lon0: json[0].header.lo1,
    lat0: json[0].header.la1,
    dx: json[0].header.dx,
    dy: json[0].header.dy,
  };

  if (json.length < 2) throw new Error("Vector data should have 2 components");

  const uData = json[0].data;
  const vData = json[1].data;

  const data: (Vector | null)[] = uData.map((_, i) =>
    isValue(uData[i]) && isValue(vData[i]) ? [uData[i], vData[i]] : null,
  );

  return interpolateField(grid, {
    data,
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
  const grid = {
    nx: json[0].header.nx,
    ny: json[0].header.ny,
    lon0: json[0].header.lo1,
    lat0: json[0].header.la1,
    dx: json[0].header.dx,
    dy: json[0].header.dy,
  };

  if (isScalar(fieldType)) {
    const interpolate = interpolateField(grid, {
      data: json[0].data,
      bilinearInterpolateFunc: bilinearInterpolateScalar,
    });

    return {
      grid,
      dataType: fieldType,
      overlayData: json[0].data,
      getScalarForOverlay: (λ: number, φ: number) => interpolate(λ, φ),
      interpolate,
    };
  }

  if (json.length < 2) throw new Error("Vector data should have 2 components");

  const uData = json[0].data;
  const vData = json[1].data;
  const overlayData = [];

  for (let i = 0; i < uData.length; i++) {
    const uValue = uData[i];
    const vValue = vData[i];
    overlayData.push(
      uValue !== null && vValue !== null
        ? Math.sqrt(uValue * uValue + vValue * vValue)
        : null,
    );
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
  const [overlayToolBox, setOverlayToolBox] = useState<
    ExtendedOverlayToolBox<Vector> | ExtendedOverlayToolBox<number> | null
  >(null);
  const [streamInterpolate, setStreamInterpolate] = useState<
    ((λ: number, φ: number) => Vector | null) | null
  >(null);

  const fetchData = async (param: FieldType) => {
    const filename = `data/${param}_data.json`;
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
      const overlayData = await fetchOverlayData(param);
      setOverlayToolBox(overlayData);

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
    };

    updateOverlay();
  }, [param]);

  return useMemo(
    () => ({ overlayToolBox, streamInterpolate }),
    [overlayToolBox, streamInterpolate],
  );
}
