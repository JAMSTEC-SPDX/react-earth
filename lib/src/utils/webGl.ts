export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:");
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

/**
 * Builds the UV grid and triangle index buffer used by the orthographic
 * WebGL overlay.
 *
 * Generates a regular lon/lat mesh over [0,1]×[0,1], with (latBands + 1) × (longBands + 1)
 * UV vertices so the sphere can be tessellated into `latBands * longBands` cells, each
 * split into two triangles.
 */
export function createUVsForSphere(latBands: number, longBands: number) {
  const uvs = [];
  const indices = [];

  // compute vertices (n+1)
  for (let y = 0; y <= latBands; y++) {
    for (let x = 0; x <= longBands; x++) {
      const u = x / longBands;
      const v = y / latBands;
      uvs.push(u, v);
    }
  }

  // compute triangles (n)
  for (let y = 0; y < latBands; y++) {
    for (let x = 0; x < longBands; x++) {
      const first = y * (longBands + 1) + x;
      const second = first + longBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    indices: new Uint16Array(indices),
    uvs: new Float32Array(uvs),
  };
}

/**
 * Creates the orthographic projection matrix used to render the overlay sphere
 * in clip space
 */
export function orthographic(size: number, aspect: number) {
  const right = size * aspect;
  const left = -right;
  const top = size;
  const bottom = -top;
  const near = -10;
  const far = 10;

  const out = new Float32Array(16);
  out[0] = 2 / (right - left);
  out[5] = 2 / (top - bottom);
  out[10] = -2 / (far - near);
  out[12] = -(right + left) / (right - left);
  out[13] = -(top + bottom) / (top - bottom);
  out[14] = -(far + near) / (far - near);
  out[15] = 1;
  return out;
}
