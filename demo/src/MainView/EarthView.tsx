import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import Earth, {
  GlobeController,
  type CoastlinesByLOD,
  type ColorScaleBounds,
  type GetColorFunc,
} from "@jamstec-spdx/react-earth";
import "@jamstec-spdx/react-earth/dist/index.css";

import EarthMenu from "./EarthMenu";
import MarkerPanel from "./MarkerPanel";
import type { Config, CustomFile, ExtendedMarker, FieldType } from "./types";
import useDataToolBox from "./useDataToolBox";
import { getColorScale } from "./utils/fieldTypes";
import { getMarkerData } from "./utils/utils";

const globeController = new GlobeController();

const ErrorMessageNotice = () => (
  <div className="error-notice">
    <h2>Invalid configuration</h2>
    <p>No data available for this configuration.</p>
  </div>
);

type EarthViewProps = {
  coastlines?: CoastlinesByLOD;
  isSecondary?: boolean;
  config: Config;
  setConfig: Dispatch<SetStateAction<Config>>;
};

const EarthView = ({
  coastlines,
  config,
  setConfig,
  isSecondary = false,
}: EarthViewProps) => {
  const [customFile, setCustomFile] = useState<CustomFile>();

  const [colorScaleBounds, setColorScaleBounds] = useState<ColorScaleBounds>({
    lowerBound: 0,
    upperBound: 1,
  });
  const [getColor, setGetColor] = useState<GetColorFunc>(() =>
    getColorScale("wind", colorScaleBounds),
  );

  const param = useMemo(() => {
    const param = config[!isSecondary ? "param1" : "param2"];
    if (param === "custom_dataset") return customFile?.dataType ?? "wind";
    if (param === "invalid_dataset") return "wind";
    return param;
  }, [isSecondary, config, customFile]);

  const {
    overlayVersion,
    overlayToolBoxRef,
    streamVersion,
    streamInterpolateRef,
    error,
    updateData,
  } = useDataToolBox(setColorScaleBounds, setGetColor);

  useEffect(() => {
    updateData(param);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateColorScale = useCallback(
    (fieldType: FieldType, newColorScaleBounds: ColorScaleBounds) => {
      setColorScaleBounds(newColorScaleBounds);
      setGetColor(() => getColorScale(fieldType, newColorScaleBounds));
    },
    [],
  );

  // ********************
  // * Marker
  // ********************
  const [marker, setMarker] = useState<ExtendedMarker>();

  useEffect(() => {
    if (marker) {
      const newMarker = getMarkerData(
        marker.lon,
        marker.lat,
        overlayToolBoxRef.current,
      );
      setMarker(newMarker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayVersion]);

  const selectMarker = useCallback(
    (λ: number, φ: number) => {
      const newMarker = getMarkerData(λ, φ, overlayToolBoxRef.current);
      setMarker(newMarker);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overlayVersion],
  );

  const removeMarker = useCallback(() => {
    setMarker(undefined);
  }, []);

  return (
    <div className="earth-view">
      <Earth
        coastlines={coastlines}
        globeController={globeController}
        projection={config.projection}
        overlayVersion={overlayVersion}
        overlayToolBoxRef={overlayToolBoxRef}
        getColor={getColor}
        streamVersion={streamVersion}
        streamInterpolateRef={streamInterpolateRef}
        marker={marker}
        selectMarker={selectMarker}
        removeMarker={removeMarker}
      >
        {error && <ErrorMessageNotice />}
      </Earth>
      <div className="floating-panels">
        <MarkerPanel marker={marker} removeMarker={removeMarker} />
        <EarthMenu
          config={config}
          setConfig={setConfig}
          validConfig={!error}
          colorScaleBounds={colorScaleBounds}
          isSecondary={isSecondary}
          updateData={updateData}
          updateColorScale={updateColorScale}
          customFile={customFile}
          uploadCustomFile={setCustomFile}
        />
      </div>
    </div>
  );
};

export default EarthView;
