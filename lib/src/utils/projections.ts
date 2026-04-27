import * as d3 from "d3-geo";

import type { View } from "../types";
import { floorMod } from "./maths";

/**
 * Returns rotation of globe to current position of the user.
 * Aside from asking for geolocation, which user may reject, there
 * is not much available except timezone.
 */
export function currentPosition(): [number, number] {
  const λ = floorMod(new Date().getTimezoneOffset() / 4, 360); // 24 hours * 60 min / 4 === 360 degrees
  return [λ, 0];
}

export function createProjection({ width, height }: View) {
  return (
    d3
      .geoOrthographic()
      .precision(0.1)
      // clips geometry beyond 90° so only the visible hemisphere of the globe is rendered
      .clipAngle(90)
      // center the globe in the view
      .translate([width / 2, height / 2])
  );
}
