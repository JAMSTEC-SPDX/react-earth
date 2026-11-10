import { useState, useEffect, useMemo } from "react";

import type { CoastlinesByLOD } from "@jamstec-spdx/react-earth";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

import { DEFAULT_CONFIG } from "./consts";
import EarthView from "./EarthView";

const MainView = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // *********************
  // * Coastlines        *
  // *********************
  const [coastlines, setCoastlines] = useState<CoastlinesByLOD>();
  useEffect(() => {
    async function loadCoastlines(
      file: string,
    ): Promise<FeatureCollection<Geometry>> {
      const topo: Topology = await fetch(
        `${import.meta.env.BASE_URL}/${file}`,
      ).then((r) => r.json());

      const coastlines = feature(topo, topo.objects.coastlines);
      return "features" in coastlines
        ? coastlines
        : {
            type: "FeatureCollection",
            features: [coastlines],
          };
    }

    const fetchTopology = async () => {
      const [low, high] = await Promise.all([
        loadCoastlines("earth-topo-110m.json"),
        loadCoastlines("earth-topo-50m.json"),
      ]);

      setCoastlines({
        low,
        high,
      });
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

export default MainView;
