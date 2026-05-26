import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import Earth, { GlobeController } from "@jamstec-spdx/react-earth";
import type { FeatureCollection, Geometry } from "geojson";
import "@jamstec-spdx/react-earth/dist/index.css";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

import { DEFAULT_CONFIG } from "./consts";
import EarthMenu from "./EarthMenu";
import MarkerPanel from "./MarkerPanel";
import type { ColorScaleBounds, Config, ExtendedMarker } from "./types";
import useDataToolBox from "./useDataToolBox";
import { getColorScale, getColorScaleBounds } from "./utils/fieldTypes";
import { getMarkerData } from "./utils/utils";

const globeController = new GlobeController();

const ErrorMessageNotice = () => (
  <div className="error-notice">
    <h2>Invalid configuration</h2>
    <p>No data available for this configuration.</p>
  </div>
);

type EarthViewProps = {
  coastlines?: FeatureCollection<Geometry>;
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
  const [colorScaleBounds, setColorScaleBounds] = useState<ColorScaleBounds>({
    lowerBound: 0,
    upperBound: 1,
  });

  const param = useMemo(
    () => config[!isSecondary ? "param1" : "param2"],
    [isSecondary, config],
  );
  const { overlayToolBox, streamInterpolate } = useDataToolBox(param);

  const getColor = useMemo(() => {
    const fieldType = overlayToolBox?.dataType || "wind";
    return getColorScale(fieldType, colorScaleBounds);
  }, [overlayToolBox?.dataType, colorScaleBounds]);

  useEffect(() => {
    const newColorScaleBounds = getColorScaleBounds(param);
    setColorScaleBounds(newColorScaleBounds);
  }, [param]);

  // ********************
  // * Marker
  // ********************
  const [marker, setMarker] = useState<ExtendedMarker>();

  // use a ref for overlayToolBox to avoid re-subscribing
  // interaction listeners on every change
  const overlayToolBoxRef = useRef(overlayToolBox);
  useEffect(() => {
    overlayToolBoxRef.current = overlayToolBox;
    if (!overlayToolBox) setMarker(undefined);
  }, [overlayToolBox]);

  const selectMarker = useCallback((λ: number, φ: number) => {
    if (!overlayToolBoxRef.current) setMarker(undefined);
    else {
      const newMarker = getMarkerData(λ, φ, overlayToolBoxRef.current);
      setMarker(newMarker);
    }
  }, []);

  const removeMarker = useCallback(() => {
    setMarker(undefined);
  }, []);

  return (
    <div className="earth-view">
      <Earth
        coastlines={coastlines}
        globeController={globeController}
        projection={config.projection}
        overlayToolBox={overlayToolBox ?? null}
        getColor={getColor}
        streamInterpolate={streamInterpolate}
        marker={marker}
        selectMarker={selectMarker}
        removeMarker={removeMarker}
      >
        {overlayToolBox === null && <ErrorMessageNotice />}
      </Earth>
      <div className="floating-panels">
        <MarkerPanel marker={marker} removeMarker={removeMarker} />
        <EarthMenu
          config={config}
          setConfig={setConfig}
          validConfig={overlayToolBox !== null}
          colorScaleBounds={colorScaleBounds}
          isSecondary={isSecondary}
          updateColorScaleBounds={setColorScaleBounds}
        />
      </div>
    </div>
  );
};

const App = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // *********************
  // * Coastlines        *
  // *********************
  const [coastlines, setCoastlines] = useState<FeatureCollection<Geometry>>();
  useEffect(() => {
    const fetchTopology = async () => {
      const topo: Topology = await fetch(
        `${import.meta.env.BASE_URL}/earth-topo.json`,
      ).then((r) => r.json());
      const coastlines = feature(topo, topo.objects.coastlines);
      setCoastlines(
        "features" in coastlines
          ? coastlines
          : {
              type: "FeatureCollection",
              features: [coastlines],
            },
      );
    };

    fetchTopology();
  }, []);

  // ******************************
  // * Globe alignement direction *
  // ******************************
  const [isPortrait, setIsPortrait] = useState(
    () => window.matchMedia("(orientation: portrait)").matches,
  );

  const globeDirection = useMemo(() => {
    if (config.projection === "equirectangular") return "column";
    return isPortrait ? "column" : "row";
  }, [config.projection, isPortrait]);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="main-page" style={{ flexDirection: globeDirection }}>
      <EarthView
        coastlines={coastlines}
        config={config}
        setConfig={setConfig}
      />
      {config.compareMode && (
        <EarthView
          coastlines={coastlines}
          config={config}
          setConfig={setConfig}
          isSecondary
        />
      )}
    </div>
  );
};

export default App;
