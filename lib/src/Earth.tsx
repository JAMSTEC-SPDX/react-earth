import { useEffect, useRef } from "react";

import type { FeatureCollection, Geometry } from "geojson";

import GlobeController from "./GlobeController";
import useSvgController from "./useSvgController";
import { useView } from "./utils/view";
import "./styles.css";

type EarthProps = {
  coastlines?: FeatureCollection<Geometry>;
  globeController: GlobeController;
};

const Earth = ({ coastlines, globeController }: EarthProps) => {
  const earthRoot = useRef<HTMLDivElement | null>(null);
  const globeSvgRef = useRef<SVGSVGElement | null>(null);

  /**
   * rotationRef stores the current globe orientation as Euler angles [λ, φ, γ] in degrees.
   * - λ (lambda) rotates the globe horizontally (longitude)
   * - φ (phi) tilts it vertically (latitude)
   * - γ (gamma) rolls it around the viewing axis (usually kept at 0, here ignored)
   */
  const rotationRef = useRef<[number, number]>(globeController.rotation);

  /** scaleRef stores the current projection scale (zoom level) */
  const scaleRef = useRef(globeController.scale);

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
    svgController.changeProjection(view, scaleRef.current, rotationRef.current);
  }, [svgController]);

  // ********************
  // * Interactions     *
  // ********************
  useEffect(() => {
    if (!svgController) return;

    const updateLayout = () => {
      rotationRef.current = globeController.rotation;
      scaleRef.current = globeController.scale;

      svgController.updateProjection(scaleRef.current, rotationRef.current);
    };

    const unsubscribeGlobeController = globeController.subscribe(globeSvgRef, {
      updateLayout,
    });

    return () => unsubscribeGlobeController();
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
