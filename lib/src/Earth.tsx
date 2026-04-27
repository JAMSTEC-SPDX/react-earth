import { useEffect, useRef } from "react";

import type { FeatureCollection, Geometry } from "geojson";

import { TRANSPARENT_BLACK } from "./consts";
import GlobeController from "./GlobeController";
import type { OverlayToolBox, Projection, Vector } from "./types";
import useOverlayController from "./useOverlayController";
import useSvgController from "./useSvgController";
import { type RGBAColor, setPixelColor } from "./utils/colors";
import { useView } from "./utils/view";
import "./styles.css";

type EarthProps = {
  coastlines?: FeatureCollection<Geometry>;
  globeController: GlobeController;
  projection: Projection;
  overlayToolBox: OverlayToolBox<Vector> | OverlayToolBox<number> | null;
  getColor: (value: number, alpha?: number | undefined) => RGBAColor;
};

const Earth = ({
  coastlines,
  globeController,
  projection,
  overlayToolBox,
  getColor,
}: EarthProps) => {
  const earthRoot = useRef<HTMLDivElement | null>(null);
  const globeSvgRef = useRef<SVGSVGElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
  const overlayController = useOverlayController(overlayCanvasRef);

  useEffect(() => {
    if (svgController && coastlines) {
      svgController.updateCoastlines(coastlines);
    }
  }, [coastlines]);

  // ********************
  // * First render     *
  // ********************
  useEffect(() => {
    if (!svgController || !overlayController) return;

    svgController.changeProjection(
      view,
      projection,
      scaleRef.current,
      rotationRef.current,
    );
    overlayController.drawOverlay(
      projection,
      rotationRef.current,
      scaleRef.current,
    );
  }, [svgController, overlayController]);

  // ********************
  // * On data change   *
  // ********************
  useEffect(() => {
    if (!overlayToolBox) overlayController?.deactivateOverlay();
  }, [overlayToolBox]);

  useEffect(() => {
    if (!overlayController || !overlayToolBox) {
      overlayController?.deactivateOverlay();
      return;
    }

    const {
      overlayData,
      grid: { nx, ny },
    } = overlayToolBox;

    // Create a buffer of colors RGBA from the overlay data, which corresponds
    // to the texture for the webGL overlay
    const colorData = new Float32Array(overlayData.length * 4);
    for (let i = 0; i < overlayData.length; i++) {
      const value = overlayData[i];
      const color = value !== null ? getColor(value) : TRANSPARENT_BLACK;
      setPixelColor(colorData, i, color);
    }

    overlayController.setupTexture(colorData, nx, ny);
    overlayController.drawOverlay(
      projection,
      rotationRef.current,
      scaleRef.current,
    );
  }, [getColor]);

  // *********************************************
  // * On projection change or window resize     *
  // *********************************************
  useEffect(() => {
    svgController?.changeProjection(
      view,
      projection,
      scaleRef.current,
      rotationRef.current,
    );
    overlayController?.drawOverlay(
      projection,
      rotationRef.current,
      scaleRef.current,
    );
  }, [projection, view]);

  // ********************
  // * Interactions     *
  // ********************
  useEffect(() => {
    if (!svgController) return;

    const updateLayout = () => {
      rotationRef.current = globeController.rotation;
      scaleRef.current = globeController.scale;

      svgController.updateProjection(scaleRef.current, rotationRef.current);
      overlayController?.drawOverlay(
        projection,
        rotationRef.current,
        scaleRef.current,
      );
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
      <canvas
        ref={overlayCanvasRef}
        className="fill-screen no-pointer-events"
        width={view.width}
        height={view.height}
      />
    </div>
  );
};

export default Earth;
