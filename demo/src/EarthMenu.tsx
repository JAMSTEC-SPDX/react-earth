import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

import type { ColorScaleBounds } from "@jamstec-spdx/react-earth";

import ColorScale from "./ColorScale";
import type { Config } from "./types";

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
        {validConfig && (
          <ColorScale
            fieldType={config[paramKey]}
            colorScaleBounds={colorScaleBounds}
            updateColorScaleBounds={updateColorScaleBounds}
          />
        )}
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
