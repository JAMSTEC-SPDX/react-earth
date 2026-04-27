import { useEffect, useState } from "react";

import type { FeatureCollection, Geometry } from "geojson";
import Earth, { GlobeController } from "react-earth";
import "react-earth/dist/index.css";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

const globeController = new GlobeController();

const EarthView = () => {
  const [coastlines, setCoastlines] = useState<FeatureCollection<Geometry>>();

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

  return (
    <div className="main-page">
      <Earth coastlines={coastlines} globeController={globeController} />
    </div>
  );
};

export default EarthView;
