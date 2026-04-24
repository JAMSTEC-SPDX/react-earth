import { useRef, useLayoutEffect, useState } from "react";

import * as d3 from "d3";
import { geoPath, type GeoPermissibleObjects, type GeoSphere } from "d3-geo";
import type { FeatureCollection, Geometry, LineString } from "geojson";

import type { View } from "./types";
import { createProjection } from "./utils/projections";

const SPHERE: GeoSphere = { type: "Sphere" };

type SvgController = {
  changeProjection: (view: View) => void;
  updateCoastlines: (coastlines: FeatureCollection<Geometry>) => void;
};

const useSvgController = (
  globeSvgRef: React.RefObject<SVGSVGElement | null>,
) => {
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const [svgController, setSvgController] = useState<SvgController | null>(
    null,
  );

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

    const updateCoastlines = (coastlines: FeatureCollection<Geometry>) => {
      const svg = globeSvgRef.current;
      if (!svg) return;

      const globeSvg = d3.select(svg);
      globeSvg
        .select(".coastlines")
        .datum(coastlines)
        .attr("d", d3.geoPath().projection(projectionRef.current!));

      updateSvg();
    };

    const changeProjection = (view: View) => {
      projectionRef.current = createProjection(view);
      updateSvg();
    };

    setSvgController({
      updateCoastlines,
      changeProjection,
    });
  }, [globeSvgRef]);

  return svgController;
};

export default useSvgController;
