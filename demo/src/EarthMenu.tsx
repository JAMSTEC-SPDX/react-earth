import {
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { ColorScaleBounds } from "@jamstec-spdx/react-earth";

import ColorScale from "./ColorScale";
import type { Config, CustomFile, FieldType } from "./types";
import { ErrorModal, UploadFileModal } from "./UploadCustomFileModals";
import { isValidRawData } from "./utils/utils";

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
  customFile?: CustomFile;
  setConfig: Dispatch<SetStateAction<Config>>;
  uploadCustomFile: (customFile: CustomFile) => void;
  updateData: (
    param: FieldType | "custom_dataset",
    customFile?: CustomFile,
  ) => Promise<void>;
  updateColorScaleBounds: Dispatch<SetStateAction<ColorScaleBounds>>;
};

const EarthMenu = ({
  config,
  validConfig,
  colorScaleBounds,
  isSecondary = false,
  customFile,
  uploadCustomFile,
  setConfig,
  updateData,
  updateColorScaleBounds,
}: EarthMenuProps) => {
  const [open, setOpen] = useState(false);

  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tmpCustomFileRef = useRef<File | null>(null);

  const isMainMenu =
    (config.projection === "ortho" && !isSecondary) ||
    (config.projection === "equirectangular" &&
      (!config.compareMode || isSecondary));

  const paramKey = useMemo(
    () => (!isSecondary ? "param1" : "param2"),
    [isSecondary],
  );

  const fieldType = useMemo(() => {
    const param = config[paramKey];
    if (param === "custom_dataset") return customFile?.dataType ?? "wind";
    return param;
  }, [paramKey, config, customFile]);

  const paramOptions = useMemo(
    () =>
      customFile
        ? ["wind", "temperature", "custom_dataset", "invalid_dataset"]
        : ["wind", "temperature", "invalid_dataset"],
    [customFile],
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
        option === "temperature" ||
        option === "invalid_dataset" ||
        option === "custom_dataset"
      ) {
        setConfig((prev) => ({ ...prev, [paramKey]: option }));
      }
    }
  };

  const handleCustomFileUpload = async (fieldType: FieldType) => {
    const file = tmpCustomFileRef.current;
    if (!file) throw new Error("No file found.");
    try {
      const fileContent = await file.text();
      const data = JSON.parse(fileContent);

      if (!isValidRawData(data, fieldType)) throw new Error("Invalid file");

      const customFile: CustomFile = { data, dataType: fieldType };
      uploadCustomFile(customFile);
      setConfig((prev) => ({ ...prev, [paramKey]: "custom_dataset" }));
      updateData("custom_dataset", customFile);
    } catch (e) {
      console.error(e);
      setShowErrorModal(true);
    }
  };

  return (
    <>
      <div className={`menu-panel ${!open ? "closed" : ""}`}>
        <MenuRow
          setting="overlay"
          options={paramOptions}
          selected={config[paramKey]}
          onClick={(option: string) => {
            updateConfig(!isSecondary ? "param1" : "param2", option);
            updateData(option as FieldType | "custom_dataset", customFile);
          }}
        />
        {fieldType !== "invalid_dataset" && validConfig && (
          <ColorScale
            fieldType={fieldType}
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

        {!isSecondary && (
          <div>
            <button
              className="action-button"
              onClick={() => {
                inputRef.current?.click();
              }}
            >
              <input
                ref={inputRef}
                type="file"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  tmpCustomFileRef.current = file ?? null;
                  if (file) setShowUploadFileModal(true);
                }}
                style={{ display: "none" }}
              />
              {customFile ? "Load new custom data" : "Load custom data"}
            </button>
          </div>
        )}
      </div>

      <button
        className="menu-toggle"
        onClick={toggleMenu}
        title={"Show/hide menu"}
      >
        react-earth
      </button>

      {showUploadFileModal && (
        <UploadFileModal
          onClose={() => {
            setShowUploadFileModal(false);
            tmpCustomFileRef.current = null;
          }}
          onSelect={handleCustomFileUpload}
        />
      )}

      {showErrorModal && (
        <ErrorModal onClose={() => setShowErrorModal(false)} />
      )}
    </>
  );
};

export default EarthMenu;
