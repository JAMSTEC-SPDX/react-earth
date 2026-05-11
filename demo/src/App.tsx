import { useCallback, useEffect, useMemo, useState } from "react";

import type { FeatureCollection, Geometry } from "geojson";
import Earth, { GlobeController, type Marker } from "react-earth";
import "react-earth/dist/index.css";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

import { DEFAULT_CONFIG } from "./consts";
import EarthMenu from "./EarthMenu";
import useDataToolBox from "./useDataToolBox";
import { getColorScale } from "./utils/fieldTypes";

const globeController = new GlobeController();

const EarthView = () => {
  const [coastlines, setCoastlines] = useState<FeatureCollection<Geometry>>();
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const { overlayToolBox, streamInterpolate } = useDataToolBox("wind");

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
  const [marker, setMarker] = useState<Marker>();

  const selectMarker = useCallback((λ: number, φ: number) => {
    setMarker({ lon: λ, lat: φ });
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
        overlayToolBox={overlayToolBox}
        getColor={getColor}
        streamInterpolate={streamInterpolate}
        marker={marker}
        selectMarker={selectMarker}
        removeMarker={removeMarker}
      />
      <EarthMenu config={config} setConfig={setConfig} />
    </div>
  );
};

export default EarthView;
