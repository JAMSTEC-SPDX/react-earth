import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FeatureCollection, Geometry } from "geojson";
import Earth, { GlobeController } from "react-earth";
import "react-earth/dist/index.css";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

import { DEFAULT_CONFIG } from "./consts";
import EarthMenu from "./EarthMenu";
import MarkerPanel from "./MarkerPanel";
import type { ExtendedMarker } from "./types";
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

const EarthView = () => {
  const [coastlines, setCoastlines] = useState<FeatureCollection<Geometry>>();
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const { overlayToolBox, streamInterpolate } = useDataToolBox(config.param);

  const getColor = useMemo(
    () => getColorScale(overlayToolBox?.dataType || "wind"),
    [overlayToolBox?.dataType],
  );

  useEffect(() => {
    const fetchTopology = async () => {
      const topo: Topology = await fetch("/earth-topo.json").then((r) =>
        r.json(),
      );
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
    <div className="main-page">
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
        <EarthMenu config={config} setConfig={setConfig} />
      </div>
    </div>
  );
};

export default EarthView;
