import * as d3 from "d3";
import { geoPath, type GeoProjection } from "d3-geo";

import { magnitude } from "./maths";
import { distortion, isInsideCircle } from "./projections";
import { getBounds } from "./view";
import { VELOCITY_SCALE, NULL_VECTOR } from "../consts";
import type {
  Projection,
  View,
  Vector,
  VectorValue,
  VectorField,
} from "../types";

/**
 * Creates a mask which will be useful to know whether the point of the canvas is visible of not, depending on the projection.
 *
 * To do so, create a detached canvas, ask the model to define the mask polygon, then fill with an opaque color.
 */
function createMask({ width, height }: View, projection: GeoProjection) {
  const canvas = d3
    .select(document.createElement("canvas"))
    .attr("width", width)
    .attr("height", height)
    .node();
  if (!canvas) throw new Error("No canvas");

  const context = canvas.getContext("2d");
  geoPath().projection(projection).context(context)({
    type: "Sphere",
  });

  if (!context) throw new Error("No context");

  context.fillStyle = "rgba(255, 0, 0, 1)";
  context.fill();

  const imageData = context.getImageData(0, 0, width, height);

  const isPixelVisible = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    // imageData.data layout: [r, g, b, a, r, g, b, a, ...]
    // non-zero alpha means pixel is visible
    return imageData.data[i + 3] > 0;
  };

  // This function is used to check whether a pixel (identified by its xy coordinates)
  // is visible on the canvas/circle and should be coloured or not.
  // Since we iterate by blocks of 4 pixels, the block will be coloured if at
  // least one of them is coloured.
  const isVisible = (x: number, y: number) => {
    return (
      isPixelVisible(x, y) ||
      isPixelVisible(x + 1, y) ||
      isPixelVisible(x, y + 1) ||
      isPixelVisible(x + 1, y + 1)
    );
  };

  return isVisible;
}

function distort(
  projection: GeoProjection,
  λ: number,
  φ: number,
  x: number,
  y: number,
  scale: number,
  vector: Vector,
): VectorValue {
  const u = vector[0] * scale;
  const v = vector[1] * scale;
  const d = distortion(projection, λ, φ, x, y);
  return [d[0] * u + d[2] * v, d[1] * u + d[3] * v, magnitude(vector)];
}

/**
 * Given a interpolation function, a projection and a view, returns the
 * image data adapted to the view and projection for the canvas.
 */
export default function applyProjectionToVectorField(
  interpolate: (λ: number, φ: number) => Vector | null,
  projection: GeoProjection,
  projectionType: Projection,
  view: View,
) {
  const isVisible = createMask(view, projection);
  const bounds = getBounds(view, projection);

  const vectorField: VectorField = [];

  function interpolateColumn(x: number) {
    const vectorColumn: VectorValue[] = [];
    const velocityScale = bounds.height * VELOCITY_SCALE;

    // interpolate by block of 4px
    for (let y = bounds.y; y <= bounds.yMax; y += 2) {
      if (isVisible(x, y)) {
        let vector: VectorValue | undefined;

        const coord = projection.invert!([x, y]);
        const [λ, φ] = coord ?? [0, 0];
        if (coord && isFinite(λ)) {
          const value = interpolate(λ, φ);
          if (
            value &&
            (projectionType !== "ortho" ||
              // ⚠️ Vector should not be computed for particles located at the edge of
              // the circle.
              isInsideCircle(view, projection, x, y))
          ) {
            vector = distort(projection, λ, φ, x, y, velocityScale, value);
          }
        }
        vectorColumn[y] = vector || NULL_VECTOR;
        vectorColumn[y + 1] = vector || NULL_VECTOR;
      }
    }
    vectorField[x] = vectorColumn;
    vectorField[x + 1] = vectorColumn;
  }

  let x = bounds.x;
  function batchInterpolate() {
    try {
      while (x < bounds.xMax) {
        interpolateColumn(x);
        x += 2;
      }
    } catch (e) {
      console.error("A problem happened", e);
    }
  }

  // call the interpolation column function and populate the vector field
  batchInterpolate();

  return vectorField;
}
