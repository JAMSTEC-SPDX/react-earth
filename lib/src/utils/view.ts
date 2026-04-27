import { useEffect, useState, type RefObject } from "react";

import { type GeoProjection, geoPath } from "d3-geo";

import type { View, ViewBounds } from "../types";
import { ensureNumber } from "./maths";

/** Takes a DOM element reference as input, and returns always updated width and height. */
export function useView(dom: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: dom.current?.offsetWidth || 1,
    height: dom.current?.offsetHeight || 1,
  });

  useEffect(() => {
    const updateSize = () => {
      const width = dom.current?.offsetWidth || 1;
      const height = dom.current?.offsetHeight || 1;

      if (size.width !== width || size.height !== height) {
        setSize({ width, height });
      }
    };

    updateSize();

    if (!dom.current) return;

    const observer = new ResizeObserver(updateSize);
    observer.observe(dom.current);

    return () => {
      observer.disconnect();
    };
  }, [dom]);

  return size;
}

/**
 * Takes the projection bounds and the view bounds and returns the projection bounds
 * clamped to the specified view.
 */
function clampedBounds(
  bounds: [[number, number], [number, number]],
  view: View,
) {
  const [upperLeft, lowerRight] = bounds;
  const x = Math.max(Math.floor(ensureNumber(upperLeft[0], 0)), 0);
  const y = Math.max(Math.floor(ensureNumber(upperLeft[1], 0)), 0);
  const xMax = Math.min(
    Math.ceil(ensureNumber(lowerRight[0], view.width)),
    view.width - 1,
  );
  const yMax = Math.min(
    Math.ceil(ensureNumber(lowerRight[1], view.height)),
    view.height - 1,
  );
  return {
    x,
    y,
    xMax,
    yMax,
    width: xMax - x + 1,
    height: yMax - y + 1,
  };
}

/** Returns the bounds of the current projection clamped to the specified view. */
export const getBounds = (
  view: View,
  projection: GeoProjection,
): ViewBounds => {
  return clampedBounds(
    geoPath().projection(projection).bounds({ type: "Sphere" }),
    view,
  );
};
