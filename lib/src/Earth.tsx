import { useEffect, useLayoutEffect, useRef } from "react";

import * as d3 from "d3";
import { geoPath, type GeoPermissibleObjects, type GeoSphere } from "d3-geo";
import type { FeatureCollection, Geometry, LineString } from "geojson";

import { createProjection } from "./utils/projections";
import { useView } from "./utils/view";
import "./styles.css";

const SPHERE: GeoSphere = { type: "Sphere" };

type EarthProps = {
  coastlines?: FeatureCollection<Geometry>;
};

const Earth = ({ coastlines }: EarthProps) => {
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

    // Coastlines
    globeSvg
      .append("path")
      .attr("class", "coastlines")
      .datum(coastlines)
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 1);

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

  useEffect(() => {
    if (!coastlines) return;

    const svg = globeSvgRef.current;
    if (!svg) return;

    const globeSvg = d3.select(svg);

    globeSvg
      .select(".coastlines")
      .datum(coastlines)
      .attr("d", d3.geoPath().projection(projectionRef.current!));
  }, [coastlines]);

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
