import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { ColorScaleBounds } from "@jamstec-spdx/react-earth";

import type { ColorScaleBoundsInput, Config } from "./types";
import { getColorScale } from "./utils/fieldTypes";
import { linearInterpolate, roundToDecimal } from "./utils/maths";
import { colorScaleBoundToInputs, useDebounceFunc } from "./utils/utils";

type MenuRowProps = {
  setting: string;
  selected: string;
  options: string[];
  onClick: (option: string) => void;
};

const MenuRow = ({
  setting,
  selected: activeOption,
  options,
  onClick,
}: MenuRowProps) =>
  options.length ? (
    <div className="setting-row">
      <div className="setting-label">{setting}</div>
      <div className="setting-options">
        {options.map((option) => (
          <button
            key={option}
            className={
              activeOption === option
                ? "setting-option active"
                : "setting-option"
            }
            onClick={() => onClick(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  ) : null;

type EarthMenuProps = {
  config: Config;
  validConfig: boolean;
  colorScaleBounds: ColorScaleBounds;
  isSecondary: boolean;
  setConfig: Dispatch<SetStateAction<Config>>;
  updateColorScaleBounds: Dispatch<SetStateAction<ColorScaleBounds>>;
};

const EarthMenu = ({
  config,
  validConfig,
  colorScaleBounds,
  isSecondary = false,
  setConfig,
  updateColorScaleBounds,
}: EarthMenuProps) => {
  const [open, setOpen] = useState(false);

  const isMainMenu =
    (config.projection === "ortho" && !isSecondary) ||
    (config.projection === "equirectangular" &&
      (!config.compareMode || isSecondary));

  const paramKey = useMemo(
    () => (!isSecondary ? "param1" : "param2"),
    [isSecondary],
  );

  const toggleMenu = () => {
    setOpen(!open);
  };

  const updateConfig = (configKey: keyof Config, option: string) => {
    if (configKey === "projection") {
      if (option === "ortho" || option === "equirectangular") {
        setConfig((prev) => ({ ...prev, projection: option }));
      }
    } else if (configKey === "compareMode") {
      setConfig((prev) => ({
        ...prev,
        compareMode: option === "compare" ? true : false,
      }));
    } else {
      if (
        option === "wind" ||
        option === "current" ||
        option === "temperature"
      ) {
        setConfig((prev) => ({ ...prev, [paramKey]: option }));
      }
    }
  };

  // ******************
  // * Color scale    *
  // ******************
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
    if (!validConfig) {
      setTmpColorScaleBounds({
        lowerBound: "-",
        upperBound: "-",
      });
    } else {
      const newInputs = colorScaleBoundToInputs(colorScaleBounds);
      if (
        newInputs.lowerBound !== tmpColorScaleBounds.lowerBound ||
        newInputs.upperBound !== tmpColorScaleBounds.upperBound
      ) {
        setTmpColorScaleBounds(newInputs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorScaleBounds, validConfig]);

  useLayoutEffect(() => {
    if (colorScaleRow.current && open) {
      // substract the label, the padding and the inputs width
      const width = colorScaleRow.current.offsetWidth - 120 - 12 - (64 + 5) * 2;
      setColorScaleWidth(width);
    }
  }, [open]);

  useEffect(() => {
    if (!colorScaleRef.current) return;
    const colorBar = colorScaleRef.current;
    const ctx = colorBar.getContext("2d");
    if (!ctx) return;

    if (!validConfig) {
      // clear the color scale
      for (let i = 0; i < colorBar.width; i++) {
        ctx.fillStyle = "rgb(0, 0, 0, 1)";
        ctx.fillRect(i, 0, 1, colorBar.height);
      }
      return;
    }

    const getColor = getColorScale(config[paramKey], colorScaleBounds);
    const { lowerBound, upperBound } = colorScaleBounds;

    // redraw the color scale (use canvas internal width & height)
    for (let i = 0; i < colorBar.width; i++) {
      const rgb = getColor(
        linearInterpolate(lowerBound, upperBound, i / (colorBar.width - 1)),
      );
      ctx.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
      ctx.fillRect(i, 0, 1, colorBar.height);
    }
  }, [colorScaleWidth, colorScaleBounds, config, paramKey, validConfig]);

  return (
    <>
      <div className={`menu-panel ${!open ? "closed" : ""}`}>
        <MenuRow
          setting="overlay"
          options={["wind", "current", "temperature"]}
          selected={config[paramKey]}
          onClick={(option: string) =>
            updateConfig(!isSecondary ? "param1" : "param2", option)
          }
        />
        <div ref={colorScaleRow} className="setting-row">
          <div className="setting-label">scale</div>
          <div className="setting-separator" />
          <div className="color-scale-container">
            <input
              className="color-scale-input"
              type="text"
              value={tmpColorScaleBounds.lowerBound}
              onChange={(e) => handleColorScaleBoundChange(e, "lowerBound")}
              disabled={!validConfig}
            />
            <canvas
              ref={colorScaleRef}
              style={{ height: "22.5px", width: `${colorScaleWidth}px` }}
            />
            <input
              type="text"
              className="color-scale-input"
              value={tmpColorScaleBounds.upperBound}
              onChange={(e) => handleColorScaleBoundChange(e, "upperBound")}
              disabled={!validConfig}
            />
          </div>
        </div>
        {isMainMenu && (
          <>
            <MenuRow
              setting="projection"
              options={["ortho", "equirectangular"]}
              selected={config.projection}
              onClick={(option: string) => updateConfig("projection", option)}
            />
            <MenuRow
              setting="mode"
              options={["compare", "single"]}
              selected={config.compareMode ? "compare" : "single"}
              onClick={(option: string) => updateConfig("compareMode", option)}
            />
          </>
        )}
      </div>
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        title={"Show/hide menu"}
      >
        earth
      </button>
    </>
  );
};

export default EarthMenu;
