import {
  getSegmentedColorScaleFunction,
  type ColorScaleBounds,
  type ColorSegment,
  type RGBAColor,
} from "@jamstec-spdx/react-earth";

import type { FieldType, Unit } from "../types";
import { linearInterpolate } from "./maths";

export function isScalar(fieldType: FieldType) {
  switch (fieldType) {
    case "wind":
      return false;
    case "temperature":
      return true;
    default:
      throw new Error(`Field type ${fieldType} not handled`);
  }
}

export function getColorScaleBounds(fieldType: FieldType) {
  switch (fieldType) {
    case "wind":
      return { lowerBound: WIND_LOWER_BOUND, upperBound: WIND_UPPER_BOUND };
    case "temperature":
      return { lowerBound: TEMP_LOWER_BOUND, upperBound: TEMP_UPPER_BOUND };
    default:
      throw new Error(`Field type ${fieldType} not handled`);
  }
}

export function getColorScale(
  fieldType: FieldType,
  colorScaleBounds: ColorScaleBounds,
): (value: number) => RGBAColor {
  let colorSegments: ColorSegment[];
  switch (fieldType) {
    case "wind": {
      colorSegments = getWindColorScale(colorScaleBounds);
      break;
    }
    case "temperature": {
      colorSegments = getTemperatureColorScale(colorScaleBounds);
      break;
    }
    default:
      throw new Error(`Field type ${fieldType} not handled`);
  }

  return getSegmentedColorScaleFunction(colorSegments);
}

export function getUnit(fieldType: FieldType): Unit {
  switch (fieldType) {
    case "wind":
      return {
        label: "m/s",
        conversion: function (x: number) {
          return x;
        },
        precision: 2,
      };
    case "temperature":
      return {
        label: "°C",
        conversion: function (x: number) {
          return x;
        },
        precision: 1,
      };
    default:
      throw new Error(`Field type ${fieldType} not handled`);
  }
}

// **************
// * WIND       *
// **************

// blue -> green -> yellow -> pink
const WIND_LOWER_BOUND = 0;
const WIND_UPPER_BOUND = 3;

const getWindColorScale = ({
  lowerBound,
  upperBound,
}: ColorScaleBounds): ColorSegment[] => [
  { bound: lowerBound, color: [0, 0, 255] },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.1),
    color: [0, 102, 255],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.5),
    color: [102, 255, 0],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.75),
    color: [255, 255, 102],
  },
  { bound: upperBound, color: [255, 204, 255] },
];

// ***************
// * Temperature *
// ***************

// white -> cyan blue -> electric blue -> black -> red -> yellow -> white
const TEMP_LOWER_BOUND = -5;
const TEMP_UPPER_BOUND = 5;

const getTemperatureColorScale = ({
  lowerBound,
  upperBound,
}: ColorScaleBounds): ColorSegment[] => [
  { bound: lowerBound, color: [255, 255, 255] },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.3),
    color: [86, 253, 255],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.4),
    color: [87, 56, 255],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.5),
    color: [0, 0, 0],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.6),
    color: [232, 28, 36],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.7),
    color: [246, 248, 50],
  },
  { bound: upperBound, color: [255, 255, 255] },
];
