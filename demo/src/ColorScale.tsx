import {
  useRef,
  useState,
  useCallback,
  type ChangeEvent,
  useEffect,
  useLayoutEffect,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { ColorScaleBounds } from "@jamstec-spdx/react-earth";

import type { ColorScaleBoundsInput, FieldType } from "./types";
import { getColorScale, getUnit } from "./utils/fieldTypes";
import { roundToDecimal, linearInterpolate } from "./utils/maths";
import { colorScaleBoundToInputs, useDebounceFunc } from "./utils/utils";

type ColorScaleProps = {
  fieldType: FieldType;
  colorScaleBounds: ColorScaleBounds;
  updateColorScaleBounds: Dispatch<SetStateAction<ColorScaleBounds>>;
};

const ColorScale = ({
  fieldType,
  colorScaleBounds,
  updateColorScaleBounds,
}: ColorScaleProps) => {
  const colorScaleRow = useRef<HTMLDivElement | null>(null);
  const colorScaleRef = useRef<HTMLCanvasElement | null>(null);
  const [colorScaleWidth, setColorScaleWidth] = useState(200);

  const [tmpColorScaleBounds, setTmpColorScaleBounds] =
    useState<ColorScaleBoundsInput>(colorScaleBoundToInputs(colorScaleBounds));

  const debouncedUpdate = useCallback(
    (newColorScaleBound: ColorScaleBoundsInput) => {
      const lower = parseFloat(newColorScaleBound.lowerBound);
      const upper = parseFloat(newColorScaleBound.upperBound);
      if (!Number.isNaN(lower) && !Number.isNaN(upper)) {
        updateColorScaleBounds({
          lowerBound: roundToDecimal(lower),
          upperBound: roundToDecimal(upper),
        });
      }
    },
    [updateColorScaleBounds],
  );
  useDebounceFunc(tmpColorScaleBounds, debouncedUpdate, 500);

  const handleColorScaleBoundChange = (
    e: ChangeEvent<HTMLInputElement>,
    key: "lowerBound" | "upperBound",
  ) => {
    setTmpColorScaleBounds((prev) => ({ ...prev, [key]: e.target.value }));
  };

  useEffect(() => {
    const newInputs = colorScaleBoundToInputs(colorScaleBounds);
    if (
      newInputs.lowerBound !== tmpColorScaleBounds.lowerBound ||
      newInputs.upperBound !== tmpColorScaleBounds.upperBound
    ) {
      setTmpColorScaleBounds(newInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorScaleBounds]);

  useLayoutEffect(() => {
    if (colorScaleRow.current) {
      // substract the label, the padding and the inputs width
      const width = colorScaleRow.current.offsetWidth - 120 - 12 - (64 + 5) * 2;
      setColorScaleWidth(width);
    }
  }, []);

  useEffect(() => {
    if (!colorScaleRef.current) return;
    const colorBar = colorScaleRef.current;
    const ctx = colorBar.getContext("2d");
    if (!ctx) return;

    const getColor = getColorScale(fieldType, colorScaleBounds);
    const { lowerBound, upperBound } = colorScaleBounds;

    // redraw the color scale (use canvas internal width & height)
    for (let i = 0; i < colorBar.width; i++) {
      const rgb = getColor(
        linearInterpolate(lowerBound, upperBound, i / (colorBar.width - 1)),
      );
      ctx.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
      ctx.fillRect(i, 0, 1, colorBar.height);
    }
  }, [colorScaleWidth, colorScaleBounds, fieldType]);

  return (
    <div ref={colorScaleRow} className="setting-row">
      <div className="setting-label">scale</div>
      <div className="setting-separator" />
      <div className="color-scale-container">
        <div className="color-scale-input-container">
          <input
            className="color-scale-input"
            type="text"
            value={tmpColorScaleBounds.lowerBound}
            onChange={(e) => handleColorScaleBoundChange(e, "lowerBound")}
          />
          <span className="color-scale-input-unit">
            {getUnit(fieldType).label}
          </span>
        </div>
        <canvas
          ref={colorScaleRef}
          style={{ height: "22.5px", width: `${colorScaleWidth}px` }}
        />
        <div className="color-scale-input-container">
          <input
            type="text"
            className="color-scale-input"
            value={tmpColorScaleBounds.upperBound}
            onChange={(e) => handleColorScaleBoundChange(e, "upperBound")}
          />
          <span className="color-scale-input-unit">
            {getUnit(fieldType).label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ColorScale;
