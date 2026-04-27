import type { GeoProjection } from "d3-geo";

import {
  VECTOR_INTENSITY_COLORS,
  MAX_INTENSITY,
  DEFAULT_MULTIPLIER,
  NULL_VECTOR,
  MAX_PARTICLE_AGE,
  PARTICLE_LINE_WIDTH,
} from "./consts";
import type { ViewBounds, VectorValue, VectorField, View } from "./types";
import { random } from "./utils/maths";
import { getBounds } from "./utils/view";

const initMovingParticles = () => VECTOR_INTENSITY_COLORS.map(() => []);

type Particle = {
  age: number;
  x: number;
  y: number;
};

type MovingParticle = Particle & { index: number; xt: number; yt: number };

/** Animates a vector field at a given instant, which represent physical flows such as wind or currents */
export class VectorAnimator {
  private ctx: CanvasRenderingContext2D;
  private viewBounds: ViewBounds;
  private animationId: number | null = null;
  private cancel = false;

  private particles: Particle[] = [];
  private movingParticles: MovingParticle[][] = initMovingParticles(); // grouped by vector intensity

  private getVectorAtPosition: (x: number, y: number) => VectorValue;
  private options: { maxIntensity: number; multiplier: number };

  constructor(
    ctx: CanvasRenderingContext2D,
    vectorField: VectorField,
    view: View,
    projection: GeoProjection,
    options = { maxIntensity: MAX_INTENSITY, multiplier: DEFAULT_MULTIPLIER },
  ) {
    this.ctx = ctx;
    this.getVectorAtPosition = function (x: number, y: number) {
      return (
        (vectorField[Math.round(x)] &&
          vectorField[Math.round(x)][Math.round(y)]) ||
        NULL_VECTOR
      );
    };
    this.viewBounds = getBounds(view, projection);
    this.options = options;
  }

  private speedIsDefined(x: number, y: number) {
    const v = this.getVectorAtPosition(x, y);
    return v[2] !== null;
  }

  private randomPosition(particle: Particle) {
    let safetyNet = 0;
    do {
      particle.x = Math.round(random(this.viewBounds.x, this.viewBounds.xMax));
      particle.y = Math.round(random(this.viewBounds.y, this.viewBounds.yMax));
    } while (!this.speedIsDefined(particle.x, particle.y) && safetyNet++ < 30);
    return particle;
  }

  /** map vector speed to a group, in order to apply its style */
  private getVectorIntensityGroupIndex(m: number) {
    return Math.max(
      Math.floor(
        (Math.min(m, MAX_INTENSITY) / MAX_INTENSITY) *
          (VECTOR_INTENSITY_COLORS.length - 1),
      ),
      0,
    );
  }

  private initParticles() {
    const particleCount = Math.round(
      this.viewBounds.width * this.options.multiplier,
    );

    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(
        this.randomPosition({ age: random(0, MAX_PARTICLE_AGE), x: 0, y: 0 }),
      );
    }
  }

  private evolve() {
    const movingParticles: MovingParticle[][] = initMovingParticles();

    this.particles.forEach((p, index) => {
      if (p.age > MAX_PARTICLE_AGE) {
        this.randomPosition(p);
        p.age = 0;
      }
      const v = this.getVectorAtPosition(p.x, p.y);

      if (v[2] === null) {
        p.age = MAX_PARTICLE_AGE + 1; // particle has escaped the grid, never to return...
        return;
      }

      const xt = p.x + v[0];
      const yt = p.y + v[1];

      if (this.speedIsDefined(xt, yt)) {
        // Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
        const movingParticle = { ...p, index, xt, yt };
        const vectorIntensityIndex = this.getVectorIntensityGroupIndex(v[2]);
        movingParticles[vectorIntensityIndex].push(movingParticle);
      } else {
        // Particle isn't visible, but it still moves through the field.
        p.x = xt;
        p.y = yt;
      }

      p.age += 1;
    });
    this.movingParticles = movingParticles;
  }

  private draw() {
    this.ctx.lineWidth = PARTICLE_LINE_WIDTH;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.90)";
    this.ctx.globalCompositeOperation = "destination-in";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.globalCompositeOperation = "source-over";

    this.movingParticles.forEach((bucket, i) => {
      if (bucket.length > 0) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = VECTOR_INTENSITY_COLORS[i];

        bucket.forEach((p) => {
          // draw the particle's movement
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p.xt, p.yt);
          // move the particle in this.particles for the next iteration
          this.particles[p.index].x = p.xt;
          this.particles[p.index].y = p.yt;
        });

        this.ctx.stroke();
      }
    });
  }

  private frame = () => {
    if (this.cancel) return;

    this.evolve();
    this.draw();

    // We intentionally throttle the animation to ~25 FPS.
    // Using requestAnimationFrame alone (~60 FPS) would make particles move
    // significantly faster since motion is frame-based, not time-based.
    setTimeout(() => {
      this.animationId = requestAnimationFrame(this.frame);
    }, 40);
  };

  start() {
    if (this.animationId) return;

    this.initParticles();
    this.animationId = requestAnimationFrame(this.frame);
  }

  stop(view: View) {
    if (this.animationId) {
      this.cancel = true;
      cancelAnimationFrame(this.animationId);
      this.ctx.clearRect(0, 0, view.width, view.height);
    }
  }
}
