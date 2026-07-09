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
    case "current":
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
    case "current":
      return {
        lowerBound: CURRENT_LOWER_BOUND,
        upperBound: CURRENT_UPPER_BOUND,
      };
    default:
      throw new Error(`Field type ${fieldType} not handled`);
  }
}

export function getColorScale(
  fieldType: FieldType,
  colorScaleBounds: ColorScaleBounds,
): (value: number, alpha?: number) => RGBAColor {
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
    case "current": {
      colorSegments = getCurrentColorScale(colorScaleBounds);
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
    case "current":
      return {
        label: "cm/s",
        conversion: function (x: number) {
          return x;
        },
        precision: 2,
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

// blue -> white -> red
const TEMP_LOWER_BOUND = -2;
const TEMP_UPPER_BOUND = 2;

const getTemperatureColorScale = ({
  lowerBound,
  upperBound,
}: ColorScaleBounds): ColorSegment[] => [
  { bound: lowerBound, color: [0, 0, 255] },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.25),
    color: [0, 102, 255],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.5),
    color: [255, 255, 255],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.75),
    color: [255, 51, 153],
  },
  { bound: upperBound, color: [255, 0, 0] },
];

// ******************
// * OCEAN CURRENTS *
// ******************

// blue -> green -> yellow -> pink
const CURRENT_LOWER_BOUND = 0;
const CURRENT_UPPER_BOUND = 150;

const getCurrentColorScale = ({
  lowerBound,
  upperBound,
}: ColorScaleBounds): ColorSegment[] => [
  { bound: lowerBound, color: [0, 0, 255] },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.1),
    color: [0, 102, 255],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.4),
    color: [102, 255, 0],
  },
  {
    bound: linearInterpolate(lowerBound, upperBound, 0.7),
    color: [255, 255, 102],
  },
  { bound: upperBound, color: [255, 204, 255] },
];
