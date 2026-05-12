import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { Config } from "./types";
import { getColorScale, getColorScaleBounds } from "./utils/fieldTypes";
import { linearInterpolate } from "./utils/maths";

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
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  validConfig: boolean;
};

const EarthMenu = ({ config, setConfig, validConfig }: EarthMenuProps) => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

  const updateConfig = (configKey: keyof Config, option: string) => {
    if (configKey === "projection") {
      if (option === "ortho" || option === "equirectangular") {
        setConfig((prev) => ({ ...prev, projection: option }));
      }
    } else {
      if (
        option === "wind" ||
        option === "current" ||
        option === "temperature"
      ) {
        setConfig((prev) => ({ ...prev, param: option }));
      }
    }
  };

  // ******************
  // * Color scale    *
  // ******************
  const colorScaleRow = useRef<HTMLDivElement | null>(null);
  const colorScaleRef = useRef<HTMLCanvasElement | null>(null);
  const [colorScaleWidth, setColorScaleWidth] = useState(200);

  const colorScaleBounds = useMemo(
    () => getColorScaleBounds(config.param),
    [config.param],
  );

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

    const getColor = getColorScale(config.param, colorScaleBounds);
    const { lowerBound, upperBound } = colorScaleBounds;

    // redraw the color scale (use canvas internal width & height)
    for (let i = 0; i < colorBar.width; i++) {
      const rgb = getColor(
        linearInterpolate(lowerBound, upperBound, i / (colorBar.width - 1)),
      );
      ctx.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
      ctx.fillRect(i, 0, 1, colorBar.height);
    }
  }, [colorScaleWidth, colorScaleBounds, config.param, validConfig]);

  return (
    <>
      <div className={`menu-panel ${!open ? "closed" : ""}`}>
        <MenuRow
          setting="overlay"
          options={["wind", "current", "temperature"]}
          selected={config.param}
          onClick={(option: string) => updateConfig("param", option)}
        />
        <div ref={colorScaleRow} className="setting-row">
          <div className="setting-label">scale</div>
          <div className="setting-separator" />
          <div className="color-scale-container">
            <input
              className="color-scale-input"
              type="text"
              value={validConfig ? colorScaleBounds.lowerBound : "-"}
              disabled
            />
            <canvas
              ref={colorScaleRef}
              style={{ height: "22.5px", width: `${colorScaleWidth}px` }}
            />
            <input
              type="text"
              className="color-scale-input"
              value={validConfig ? colorScaleBounds.upperBound : "-"}
              disabled
            />
          </div>
        </div>
        <MenuRow
          setting="projection"
          options={["ortho", "equirectangular"]}
          selected={config.projection}
          onClick={(option: string) => updateConfig("projection", option)}
        />
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
