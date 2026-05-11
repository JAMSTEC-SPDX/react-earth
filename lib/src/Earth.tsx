import { useCallback, useEffect, useRef } from "react";

import type { FeatureCollection, Geometry } from "geojson";

import { TRANSPARENT_BLACK } from "./consts";
import GlobeController from "./GlobeController";
import type { OverlayToolBox, Projection, Vector, View } from "./types";
import useOverlayController from "./useOverlayController";
import useSvgController from "./useSvgController";
import applyProjectionToVectorField from "./utils/applyProjectionToVectorField";
import { type RGBAColor, setPixelColor } from "./utils/colors";
import { createProjection } from "./utils/projections";
import { useView } from "./utils/view";
import "./styles.css";
import { VectorAnimator } from "./VectorAnimator";

type EarthProps = {
  coastlines?: FeatureCollection<Geometry>;
  globeController: GlobeController;
  projection: Projection;
  overlayToolBox: OverlayToolBox<Vector> | OverlayToolBox<number> | null;
  getColor: (value: number, alpha?: number | undefined) => RGBAColor;
  streamInterpolate?: ((λ: number, φ: number) => Vector | null) | null;
};

const Earth = ({
  coastlines,
  globeController,
  projection,
  overlayToolBox,
  getColor,
  streamInterpolate,
}: EarthProps) => {
  const earthRoot = useRef<HTMLDivElement | null>(null);
  const globeSvgRef = useRef<SVGSVGElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vectorAnimatorRef = useRef<VectorAnimator | null>(null);

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

  // introduce some ref to avoid re-subscribing interaction listeners on every change
  const viewRef = useRef<View>({ width: 1, height: 1 });
  viewRef.current = view;
  const projectionRef = useRef<Projection>(projection);
  projectionRef.current = projection;
  const streamInterpolateRef = useRef(streamInterpolate);
  streamInterpolateRef.current = streamInterpolate;

  useEffect(() => {
    if (svgController && coastlines) {
      svgController.updateCoastlines(coastlines);
    }
  }, [coastlines]);

  // *******************
  // * Vector animator *
  // *******************
  const resetVectorAnimator = useCallback(() => {
    // clear previous canvas
    vectorAnimatorRef.current?.stop();

    const animationCtx = vectorCanvasRef.current?.getContext("2d");
    if (!streamInterpolateRef.current || !animationCtx) return;

    // rotate and scale projection, then compute vector field
    const p = createProjection(viewRef.current, projectionRef.current);
    p.rotate([...rotationRef.current, 0]).scale(scaleRef.current);

    const vectorField = applyProjectionToVectorField(
      streamInterpolateRef.current,
      p,
      projectionRef.current,
      viewRef.current,
    );

    // animate vector particles
    const animator = new VectorAnimator(
      animationCtx,
      vectorField,
      viewRef.current,
      p,
    );
    vectorAnimatorRef.current = animator;
    animator.start();

    return () => {
      animator.stop();
    };
  }, []);

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
    resetVectorAnimator();
  }, [svgController, overlayController]);

  // ********************
  // * On data change   *
  // ********************
  useEffect(() => {
    if (!overlayToolBox) overlayController?.deactivateOverlay();
  }, [overlayToolBox]);

  useEffect(() => {
    resetVectorAnimator();
  }, [streamInterpolate]);

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
    vectorAnimatorRef.current?.updateView(view);
    resetVectorAnimator();
  }, [projection, view]);

  // ********************
  // * Interactions     *
  // ********************
  useEffect(() => {
    if (!svgController) return;

    const updateLayout = () => {
      // clear animation before dragging or zooming
      vectorAnimatorRef.current?.stop();

      rotationRef.current = globeController.rotation;
      scaleRef.current = globeController.scale;

      svgController.updateProjection(scaleRef.current, rotationRef.current);
      overlayController?.drawOverlay(
        projectionRef.current,
        rotationRef.current,
        scaleRef.current,
      );
    };

    const unsubscribeGlobeController = globeController.subscribe(globeSvgRef, {
      resetVectorAnimator,
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
      <canvas
        ref={vectorCanvasRef}
        className="fill-screen no-pointer-events"
        width={view.width}
        height={view.height}
      />
    </div>
  );
};

export default Earth;
