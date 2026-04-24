import { useEffect, useLayoutEffect, useRef } from "react";

import * as d3 from "d3";
import { geoPath, type GeoPermissibleObjects, type GeoSphere } from "d3-geo";
import { LineString } from "geojson";

import { useView } from "./utils/view";
import { createProjection } from "./utils/projections";
import "./styles.css";

const SPHERE: GeoSphere = { type: "Sphere" };

const Earth = () => {
  const earthRoot = useRef<HTMLDivElement | null>(null);
  const globeSvgRef = useRef<SVGSVGElement | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  const view = useView(earthRoot);

  useLayoutEffect(() => {
    const svg = globeSvgRef.current;
    if (!svg) return;

    // **********************
    // * SVG initialization *
    // **********************
    const globeSvg = d3.select<SVGSVGElement, unknown>(svg);
    globeSvg.selectAll("*").remove();

    // Sphere
    globeSvg.append("path").datum(SPHERE).attr("fill", "#0a0a0a");

    // Graticules (long/lat grid) and equator line
    const graticule = d3.geoGraticule();
    globeSvg
      .append("path")
      .datum(graticule())
      .attr("fill", "none")
      .attr("stroke", "rgba(200,200,200,0.4)")
      .attr("stroke-width", 0.5);

    const equator: LineString = {
      type: "LineString",
      coordinates: d3.range(-180, 181, 1).map((lon) => [lon, 0]),
    };
    globeSvg
      .append("path")
      .datum(equator)
      .attr("fill", "none")
      .attr("stroke", "#707070")
      .attr("stroke-width", 1.25);

    // **************
    // * SVG update *
    // **************
    const updateSvg = () => {
      const path = geoPath<SVGPathElement, GeoPermissibleObjects>().projection(
        projectionRef.current!,
      );
      globeSvg
        .selectAll<SVGPathElement, GeoPermissibleObjects>("path")
        .attr("d", path);
    };

    projectionRef.current = createProjection(view);
    updateSvg();
  }, [globeSvgRef, view]);

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
