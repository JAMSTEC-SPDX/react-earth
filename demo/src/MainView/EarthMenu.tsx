import {
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { ColorScaleBounds } from "@jamstec-spdx/react-earth";
import { useNavigate } from "react-router-dom";

import ColorScale from "./ColorScale";
import type { Config, CustomFile, FieldType } from "./types";
import { ErrorModal, UploadFileModal } from "./UploadCustomFileModals";
import { isValidRawData } from "./utils/utils";

type MenuRowProps<T extends string> = {
  setting: string;
  selected: T;
  options: T[];
  onClick: (option: T) => void;
};

const MenuRow = <T extends string>({
  setting,
  selected: activeOption,
  options,
  onClick,
}: MenuRowProps<T>) =>
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
  updateColorScale: (
    fieldType: FieldType,
    newColorScaleBounds: ColorScaleBounds,
  ) => void;
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
  updateColorScale,
}: EarthMenuProps) => {
  const navigate = useNavigate();

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
      (customFile
        ? ["wind", "temperature", "custom_dataset", "invalid_dataset"]
        : ["wind", "temperature", "invalid_dataset"]) as (
        FieldType | "custom_dataset"
      )[],
    [customFile],
  );

  const toggleMenu = () => {
    setOpen(!open);
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
        <p className="note">
          These datasets are synthetic data created specifically for this
          demonstration.
        </p>
        <MenuRow
          setting="overlay"
          options={paramOptions}
          selected={config[paramKey]}
          onClick={(option) => {
            setConfig((prev) => ({ ...prev, [paramKey]: option }));
            updateData(option, customFile);
          }}
        />
        {fieldType !== "invalid_dataset" && validConfig && (
          <ColorScale
            fieldType={fieldType}
            colorScaleBounds={colorScaleBounds}
            updateColorScale={updateColorScale}
          />
        )}
        {isMainMenu && (
          <>
            <MenuRow
              setting="projection"
              options={["ortho", "equirectangular"]}
              selected={config.projection}
              onClick={(option) => {
                setConfig((prev) => ({ ...prev, projection: option }));
              }}
            />
            <MenuRow
              setting="mode"
              options={["compare", "single"]}
              selected={config.compareMode ? "compare" : "single"}
              onClick={() => {
                setConfig((prev) => ({
                  ...prev,
                  compareMode: !prev.compareMode,
                }));
              }}
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

            <button
              className="action-button"
              onClick={() => {
                navigate("/about");
              }}
            >
              Documentation
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
