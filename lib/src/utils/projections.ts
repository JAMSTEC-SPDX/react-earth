import * as d3 from "d3-geo";

import type { View } from "../types";

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
