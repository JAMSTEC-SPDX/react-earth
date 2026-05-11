import { currentPosition } from "./utils/projections";

const DRAG_THRESHOLD = 5; // pixels

// Adapt the base scale to the user viewport
const width = window.innerWidth;
const height = window.innerHeight;
const BASE_SCALE = Math.min(width, height) / 2.2;

const MIN_SCALE = BASE_SCALE * 0.5;
const MAX_SCALE = BASE_SCALE * 10;
const ZOOM_INTENSITY = 0.001;

type GlobeListener = {
  /** used during drag and zoom to update svg+overlay, but not the vector animator */
  updateLayout: () => void;
  /** reset the vector animator once the movement is over */
  resetVectorAnimator: () => void;
  /** used to handle marker if needed */
  handleClick: (e: MouseEvent) => void;
};

export default class GlobeController {
  public rotation: [number, number] = currentPosition();
  public scale: number = BASE_SCALE;
  private listeners: Set<GlobeListener> = new Set();
  private previousRedraw: number | null = null;

  setRotation(r: [number, number]) {
    this.rotation = r;
    this.emit();
  }

  setScale(s: number) {
    this.scale = s;
    this.emit();
  }

  // **************
  // * Drag logic *
  // **************
  // Drag updates the globe rotation based on mouse movement.
  // We compute the delta from the initial mouse position and
  // convert it into longitude (λ) and latitude (φ) using a
  // scale-adjusted sensitivity factor. The rotation is stored
  // in rotationRef and applied during draw().
  private startMouse: [number, number] | null = null;
  private startScale = 0;
  private sensitivity = 0;
  private initialRotation: [number, number] = [0, 0];
  private isDragging = false;
  private draggingGlobe: GlobeListener | undefined = undefined;

  handleMouseDown = (globe: GlobeListener) => (e: MouseEvent) => {
    this.startMouse = [e.clientX, e.clientY];
    this.startScale = this.scale;
    this.sensitivity = 60 / this.startScale;
    this.initialRotation = [...this.rotation];
    this.isDragging = false;
    this.draggingGlobe = globe;

    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseup", this.handleMouseUp);
  };

  handleMouseMove = (e: MouseEvent) => {
    if (!this.startMouse) return;

    // The Y delta is inverted because screen coordinates increase downward,
    // while geographic latitude increases upward (north), so we flip the sign
    // to keep the drag direction natural.
    const dx = e.clientX - this.startMouse[0];
    const dy = this.startMouse[1] - e.clientY;

    if (!this.isDragging) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= DRAG_THRESHOLD) return; // ignore simple click
      this.isDragging = true;
    }

    this.setRotation([
      dx * this.sensitivity + this.initialRotation[0],
      dy * this.sensitivity + this.initialRotation[1],
    ]);
  };

  handleMouseUp = (e: MouseEvent) => {
    this.startMouse = null;

    if (!this.isDragging) {
      this.draggingGlobe?.handleClick(e);
    }

    this.draggingGlobe = undefined;

    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
  };

  // **************
  // * Zoom logic *
  // **************
  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    const delta = -e.deltaY * ZOOM_INTENSITY;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, this.scale * (1 + delta)),
    );
    this.setScale(newScale);
  };

  // **********************
  // * Subscribe and emit *
  // **********************
  subscribe(
    globeSvgRef: React.RefObject<SVGSVGElement | null>,
    listener: GlobeListener,
  ) {
    this.listeners.add(listener);

    const mouseDownHandler = this.handleMouseDown(listener);

    const globeSvg = globeSvgRef.current;
    if (globeSvg) {
      globeSvg.addEventListener("wheel", this.handleWheel, { passive: false });
      globeSvg.addEventListener("mousedown", mouseDownHandler);
    }

    return () => {
      this.listeners.delete(listener);
      if (globeSvg) {
        globeSvg.removeEventListener("wheel", this.handleWheel);
        globeSvg.removeEventListener("mousedown", mouseDownHandler);
        window.removeEventListener("mousemove", this.handleMouseMove);
        window.removeEventListener("mouseup", this.handleMouseUp);
      }
    };
  }

  emit() {
    this.listeners.forEach((listener) => listener.updateLayout());

    // redraw the overlay only 120ms after the end of the zoom, to improve performance
    if (this.previousRedraw) clearTimeout(this.previousRedraw);
    this.previousRedraw = window.setTimeout(() => {
      this.listeners.forEach((listener) => listener.resetVectorAnimator());
    }, 120);
  }
}
