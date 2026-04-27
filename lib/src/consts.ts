import type { VectorValue } from "./types";
import type { RGBAColor } from "./utils/colors";

export const TRANSPARENT_BLACK: RGBAColor = [0, 0, 0, 0];

// VECTOR PARTICLES CONFIGURATION
export const NULL_VECTOR: VectorValue = [NaN, NaN, null]; // singleton for undefined location outside the vector field [u, v, mag]
export const MAX_PARTICLE_AGE = 100; // max number of frames a particle is drawn before regeneration
export const VELOCITY_SCALE = 1 / 3000;
export const MAX_INTENSITY = 2;
export const DEFAULT_MULTIPLIER = 7;

export const PARTICLE_LINE_WIDTH = 1.0; // line width of a drawn particle
const INTENSITY_SCALE_STEP = 10;
export const VECTOR_INTENSITY_COLORS: string[] = [];
for (let j = 85; j <= 255; j += INTENSITY_SCALE_STEP) {
  VECTOR_INTENSITY_COLORS.push(`rgba(${j}, ${j}, ${j}, 1.0)`);
}
