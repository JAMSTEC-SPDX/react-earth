import { useEffect, useRef } from "react";

import type { FeatureCollection, Geometry } from "geojson";

import useSvgController from "./useSvgController";
import { useView } from "./utils/view";
import "./styles.css";

type EarthProps = {
  coastlines?: FeatureCollection<Geometry>;
};

const Earth = ({ coastlines }: EarthProps) => {
  const earthRoot = useRef<HTMLDivElement | null>(null);
  const globeSvgRef = useRef<SVGSVGElement | null>(null);

  const view = useView(earthRoot);

  const svgController = useSvgController(globeSvgRef);

  useEffect(() => {
    if (svgController && coastlines) {
      svgController.updateCoastlines(coastlines);
    }
  }, [coastlines]);

  // ********************
  // * First render     *
  // ********************
  useEffect(() => {
    if (!svgController) return;
    svgController.changeProjection(view);
  }, [svgController]);

  return (
    <div ref={earthRoot} className="earth-root">
      <svg
        ref={globeSvgRef}
        className="fill-screen"
        width={view.width}
        height={view.height}
      />
    </div>
  );
};

export default Earth;
