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

  const updateConfig = (option: string) => {
    if (option === "ortho" || option === "equirectangular") {
      setConfig({ projection: option });
    }
  };

  return (
    <div className="earth-menu">
      <div className={`menu-panel ${!open ? "closed" : ""}`}>
        <MenuRow
          setting="projection"
          options={["ortho", "equirectangular"]}
          selected={config.projection}
          onClick={(option: string) => updateConfig(option)}
        />
      </div>
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        title={"Show/hide menu"}
      >
        earth
      </button>
    </div>
  );
};

export default EarthMenu;
