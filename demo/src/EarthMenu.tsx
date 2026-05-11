import { useState } from "react";

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
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
};

const EarthMenu = ({ config, setConfig }: EarthMenuProps) => {
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

  return (
    <>
      <div className={`menu-panel ${!open ? "closed" : ""}`}>
        <MenuRow
          setting="overlay"
          options={["wind", "current", "temperature"]}
          selected={config.param}
          onClick={(option: string) => updateConfig("param", option)}
        />
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
