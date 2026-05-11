import { useRef, useLayoutEffect, useState } from "react";

import * as d3 from "d3";
import { geoPath, type GeoPermissibleObjects, type GeoSphere } from "d3-geo";
import type { FeatureCollection, Geometry, LineString, Point } from "geojson";

import type { View, Projection, Marker } from "./types";
import { createProjection } from "./utils/projections";

const SPHERE: GeoSphere = { type: "Sphere" };

type SvgController = {
  changeProjection: (
    view: View,
    projection: Projection,
    scale: number,
    rotation: [number, number],
  ) => void;
  updateProjection: (scale: number, rotation: [number, number]) => void;
  updateCoastlines: (coastlines: FeatureCollection<Geometry>) => void;
  drawMarker: (marker: Marker) => void;
  moveMarker: () => void;
  removeMarker: () => void;
};

const useSvgController = (
  globeSvgRef: React.RefObject<SVGSVGElement | null>,
  foregroundRef: React.RefObject<SVGSVGElement | null>,
) => {
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const markerRef = useRef<Marker | null>(null);
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
    const moveMarker = () => {
      if (
        !foregroundRef.current ||
        !markerRef.current ||
        !projectionRef.current
      )
        return;

      const path = geoPath<SVGPathElement, GeoPermissibleObjects>().projection(
        projectionRef.current,
      );

      const markerSvg = d3
        .select(foregroundRef.current)
        .select<SVGPathElement>(".location-mark");
      if (!markerSvg.node()) return;

      const point: Point = {
        type: "Point",
        coordinates: [markerRef.current.lon, markerRef.current.lat],
      };
      markerSvg.datum(point).attr("d", path);
    };

    const drawMarker = (marker: Marker) => {
      if (!foregroundRef.current) return;
      markerRef.current = marker;

      let markerSvg = d3
        .select(foregroundRef.current)
        .select<SVGPathElement>(".location-mark");
      if (!markerSvg.node()) {
        markerSvg = d3
          .select(foregroundRef.current)
          .append("path")
          .attr("class", "location-mark");
      }

      moveMarker();
    };

    const removeMarker = () => {
      if (!foregroundRef.current) return;

      markerRef.current = null;
      d3.select(foregroundRef.current)
        .select<SVGPathElement>(".location-mark")
        .remove();
    };

    const updateSvg = () => {
      const path = geoPath<SVGPathElement, GeoPermissibleObjects>().projection(
        projectionRef.current!,
      );
      globeSvg
        .selectAll<SVGPathElement, GeoPermissibleObjects>("path")
        .attr("d", path);
      moveMarker();
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

    const changeProjection = (
      view: View,
      projection: Projection,
      scale: number,
      rotation: [number, number],
    ) => {
      projectionRef.current = createProjection(view, projection)
        .rotate([...rotation, 0])
        .scale(scale);

      updateSvg();
    };

    const updateProjection = (scale: number, rotation: [number, number]) => {
      if (!projectionRef.current) return;
      projectionRef.current.rotate([...rotation, 0]).scale(scale);

      updateSvg();
    };

    setSvgController({
      changeProjection,
      updateProjection,
      updateCoastlines,
      drawMarker,
      moveMarker,
      removeMarker,
    });
  }, []);

  return svgController;
};

export default useSvgController;
