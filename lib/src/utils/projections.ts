import * as d3 from "d3-geo";
import type { GeoProjection } from "d3-geo";

import { floorMod } from "./maths";
import type { View, Projection } from "../types";

/**
 * Returns rotation of globe to current position of the user (deduced from timezone)
 */
export function currentPosition(): [number, number] {
  const λ = floorMod(new Date().getTimezoneOffset() / 4, 360); // 24 hours * 60 min / 4 === 360 degrees
  return [λ, 0];
}

export function createProjection(
  { width, height }: View,
  projectionType: Projection,
) {
  switch (projectionType) {
    case "ortho":
      return (
        d3
          .geoOrthographic()
          .precision(0.1)
          // clips geometry beyond 90° so only the visible hemisphere of the globe is rendered
          .clipAngle(90)
          // center the globe in the view
          .translate([width / 2, height / 2])
      );
    case "equirectangular":
      return d3
        .geoEquirectangular()
        .rotate(currentPosition())
        .precision(0.1)
        .scale(width / (2 * Math.PI))
        .translate([width / 2, height / 2]);
    default:
      throw new Error(`Projection ${projectionType} not supported.`);
  }
}

/**
 * Returns the distortion introduced by the specified projection at the given point.
 *
 * This method uses finite difference estimates to calculate warping by adding a very small amount (h) to
 * both the longitude and latitude to create two lines. These lines are then projected to pixel space, where
 * they become diagonals of triangles that represent how much the projection warps longitude and latitude at
 * that location.
 *
 * <pre>
 *        (λ, φ+h)                  (xλ, yλ)
 *           .                         .
 *           |               ==>        \
 *           |                           \   __. (xφ, yφ)
 *    (λ, φ) .____. (λ+h, φ)       (x, y) .--
 * </pre>
 *
 * See:
 *     Map Projections: A Working Manual, Snyder, John P: pubs.er.usgs.gov/publication/pp1395
 *     gis.stackexchange.com/questions/5068/how-to-create-an-accurate-tissot-indicatrix
 *     www.jasondavies.com/maps/tissot
 *
 * @returns {Array} array of scaled derivatives [dx/dλ, dy/dλ, dx/dφ, dy/dφ]
 */
export function distortion(
  projection: GeoProjection,
  λ: number,
  φ: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const H = 0.000036; // 0.0000360°φ ~= 4m

  const hλ = λ < 0 ? H : -H;
  const hφ = φ < 0 ? H : -H;
  const pλ = projection([λ + hλ, φ]);
  const pφ = projection([λ, φ + hφ]);

  // Meridian scale factor (see Snyder, equation 4-3), where R = 1. This handles issue where length of 1° λ
  // changes depending on φ. Without this, there is a pinching effect at the poles.
  const k = Math.cos((φ / 360) * 2 * Math.PI);

  if (!pλ) throw new Error("pλ is null");
  if (!pφ) throw new Error("pφ is null");

  return [
    (pλ[0] - x) / hλ / k,
    (pλ[1] - y) / hλ / k,
    (pφ[0] - x) / hφ,
    (pφ[1] - y) / hφ,
  ];
}

/**
 * A pixel with position [x,y] is inside the circle only if its distance to the
 * pixel at the center of the circle is < the radius of the current projection.
 */
export function isInsideCircle(
  { width, height }: View,
  projection: GeoProjection,
  x: number,
  y: number,
) {
  // distance to the center of the visible projection (px)
  const dx = x - width / 2;
  const dy = y - height / 2;

  const r = projection.scale(); // radius of the visible projection in px

  return dx * dx + dy * dy < r * r;
}
