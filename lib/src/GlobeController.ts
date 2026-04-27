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
  /** used during drag and zoom to update svg+overlay, but not the wind animator */
  updateLayout: () => void;
};

export default class GlobeController {
  public rotation: [number, number] = currentPosition();
  public scale: number = BASE_SCALE;
  private listeners: Set<GlobeListener> = new Set();

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

  handleMouseDown = () => (e: MouseEvent) => {
    this.startMouse = [e.clientX, e.clientY];
    this.startScale = this.scale;
    this.sensitivity = 60 / this.startScale;
    this.initialRotation = [...this.rotation];
    this.isDragging = false;

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

  handleMouseUp = () => {
    this.startMouse = null;

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

    const mouseDownHandler = this.handleMouseDown();

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
  }
}
