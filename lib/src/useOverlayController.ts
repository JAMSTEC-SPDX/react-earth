import { useLayoutEffect, useRef } from "react";

import type { Projection } from "./types";
import { compileShader, createUVsForSphere, orthographic } from "./utils/webGl";

type OverlayController = {
  deactivateOverlay: () => void;
  setupTexture: (
    colorData: Float32Array<ArrayBuffer>,
    nx: number,
    ny: number,
  ) => void;
  drawOverlay: (
    prjection: Projection,
    rotation: [number, number],
    scale: number,
  ) => void;
  cleanUp: () => void;
};

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    throw new Error(log ?? "Program link failed");
  }

  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);

  const cleanup = () => {
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  };

  return { program, cleanup };
}

const useOverlayController = (
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>,
) => {
  const overlayDeactivated = useRef(true);
  const overlayControllerRef = useRef<OverlayController | null>(null);

  useLayoutEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL not supported");

    if (!gl.getExtension("OES_texture_float_linear"))
      console.error("OES_texture_float_linear not supported");

    const clearOverlay = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      return;
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // -------------------------
    // 1️⃣ TEXTURE SETUP
    // -------------------------
    const texture = gl.createTexture();

    const deactivateOverlay = () => {
      overlayDeactivated.current = true;
      clearOverlay();
    };

    const setupTexture = (
      colorData: Float32Array<ArrayBuffer>,
      nx: number,
      ny: number,
    ) => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32F,
        nx,
        ny,
        0,
        gl.RGBA,
        gl.FLOAT,
        colorData,
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      overlayDeactivated.current = false;
    };

    // -------------------------
    // 2️⃣ PROGRAMS AND SHADERS
    // -------------------------

    // ---------- ORTHO PROGRAM ----------

    // The rotation is applied in the vertex shader because it affects
    // the final vertex position (gl_Position).
    //
    // Processing steps:
    // - convert the vertex UV coordinates to longitude/latitude
    // - convert longitude/latitude to spherical coordinates (x, y, z)
    // - apply the rotation matrices (around the X and Y axes)
    // - apply the projection matrix to compute gl_Position

    const orthoVertexShaderSource = `#version 300 es
    precision highp float;

    in vec2 aUV;

    uniform vec2 uRotation;
    uniform mat4 uProjection;

    out vec2 vUV;

    const float PI = 3.141592653589793;
    const float EPS = 1e-5;

    vec3 sph(float lon, float lat) {
      float x = cos(lat) * sin(lon);
      float y = sin(lat);
      float z = cos(lat) * cos(lon);
      return vec3(x, y, z);
    }

    mat3 rotX(float a) {
      return mat3(
        1.0,     0.0,    0.0,
        0.0,  cos(a), sin(a),
        0.0, -sin(a), cos(a)
      );
    }

    mat3 rotY(float a) {
      return mat3(
        cos(a), 0.0, -sin(a),
            0.0, 1.0,     0.0,
        sin(a), 0.0,  cos(a)
      );
    }

    void main() {
      vUV = aUV;

      // - Convert lon/lat from [0,1] to [-π,π] and [-π/2,π/2]
      // - Flip y to compensate for the opposite latitude orientation
      //   between the dataset and the sphere UV mapping
      float lon = aUV.x * 2.0 * PI - PI;
      float lat = (1.0 - aUV.y) * PI - PI * 0.5;

      vec3 p = sph(lon, lat);

      float lambda = radians(uRotation.x);
      float phi = radians(uRotation.y);

      vec3 pr = rotX(-phi) * rotY(lambda) * p;

      gl_Position = uProjection * vec4(pr, 1.0);
    }
  `;

    const orthoFragmentShaderSource = `#version 300 es
    precision highp float;

    in vec2 vUV;

    uniform sampler2D uTexture;

    out vec4 outColor;

    void main() {
      // Shift the texture horizontally by π to match the sphere webGL orientation
      vec2 uv = vec2(fract(vUV.x + 0.5), vUV.y);
      outColor = texture(uTexture, uv);
    }
  `;

    const { program: orthoProgram, cleanup: cleanUpOrthoProgram } =
      createProgram(gl, orthoVertexShaderSource, orthoFragmentShaderSource);

    const orthoLocations = {
      uRotation: gl.getUniformLocation(orthoProgram, "uRotation"),
      aUV: gl.getAttribLocation(orthoProgram, "aUV"),
      uProjection: gl.getUniformLocation(orthoProgram, "uProjection"),
    };

    // ---------- EQUIRECT PROGRAM ----------

    // The rotation is applied in the fragment shader because the screen
    // position (gl_Position) is already known from the quad vertices.
    // The vertex shader simply passes screen coordinates.
    //
    // Processing steps:
    // - convert screen coordinates (x, y) to longitude/latitude
    // - convert longitude/latitude to spherical coordinates (x, y, z)
    // - apply the rotation matrices (around the X and Y axes)
    // - convert the rotated spherical coordinates (x', y', z')
    //   back to geographic coordinates (lon', lat') for texture lookup

    const equirectVertexShaderSource = `#version 300 es
    precision highp float;

    in vec2 aScreenPos;
    out vec2 vScreenPos;

    void main() {
      vScreenPos = aScreenPos;
      gl_Position = vec4(aScreenPos, 0.0, 1.0);
    }
  `;

    const equirectFragmentShaderSource = `#version 300 es
    precision highp float;

    in vec2 vScreenPos;

    uniform sampler2D uTexture;
    uniform vec2 uRotation;
    uniform vec2 uViewport;
    uniform float uScale;

    out vec4 outColor;

    const float PI = 3.141592653589793;

    vec3 sph(float lon, float lat) {
    float x = cos(lat) * sin(lon);
    float y = sin(lat);
    float z = cos(lat) * cos(lon);
    return vec3(x, y, z);
    }

    mat3 rotX(float a) {
      return mat3(
        1.0,     0.0,    0.0,
        0.0,  cos(a), sin(a),
        0.0, -sin(a), cos(a)
      );
    }

    mat3 rotY(float a) {
      return mat3(
        cos(a), 0.0, -sin(a),
           0.0, 1.0,     0.0,
        sin(a), 0.0,  cos(a)
      );
    }

    void main() {
      float halfW = uViewport.x * 0.5 / uScale;
      float halfH = uViewport.y * 0.5 / uScale;

      float lon = vScreenPos.x * halfW;
      float lat = vScreenPos.y * halfH;

      // Clip to stay above the svg
      if (lon < -PI || lon > PI || lat < -PI * 0.5 || lat > PI * 0.5) {
        discard;
      }

      vec3 p = sph(lon, lat);

      float lambda = radians(uRotation.x);
      float phi = radians(uRotation.y);

      vec3 rotatedP = rotY(-lambda) * rotX(phi) * p;

      float rotatedLon = atan(rotatedP.x, rotatedP.z);
      float rotatedLat = asin(clamp(rotatedP.y, -1.0, 1.0));

      // uv should be in [0, 1] -> normalize
      vec2 uv = vec2(
        fract((rotatedLon + PI) / (2.0 * PI) + 0.5), // Fract to avoid meridian cut and add 0.5 to shift the
                                                     // texture horizontally by π to match the sphere webGL orientation
        1.0 - ((rotatedLat + PI * 0.5) / PI)         // Flip lat to match texture
      );

      outColor = texture(uTexture, uv);
    }
  `;

    const { program: equirectProgram, cleanup: cleanUpEquirectProgram } =
      createProgram(
        gl,
        equirectVertexShaderSource,
        equirectFragmentShaderSource,
      );

    const equirectLocations = {
      uRotation: gl.getUniformLocation(equirectProgram, "uRotation"),
      aScreenPos: gl.getAttribLocation(equirectProgram, "aScreenPos"),
      uViewport: gl.getUniformLocation(equirectProgram, "uViewport"),
      uScale: gl.getUniformLocation(equirectProgram, "uScale"),
    };

    // -------------------------
    // 3️⃣ UV INITIALIZATION
    // -------------------------
    // sphere mesh
    const { indices, uvs } = createUVsForSphere(360, 180);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    // screen quad
    const quadPositions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    const quadIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);

    const quadPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);

    const quadIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW);

    const buffers = [
      indexBuffer,
      uvBuffer,
      quadPositionBuffer,
      quadIndexBuffer,
    ];

    // -------------------------
    // 4️⃣ RENDER
    // -------------------------
    let currentProgram: WebGLProgram | null = null;

    function drawOverlay(
      projection: Projection,
      rotation: [number, number],
      scale: number,
    ) {
      if (overlayDeactivated.current) return;
      if (!gl) throw new Error("No gl context !");
      if (!canvas) throw new Error("No canvas !");

      const isOrtho = projection === "ortho";

      const { program, locations } = isOrtho
        ? { program: orthoProgram, locations: orthoLocations }
        : { program: equirectProgram, locations: equirectLocations };

      if (program !== currentProgram) {
        gl.useProgram(program);
        currentProgram = program;
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.uniform2f(locations.uRotation, rotation[0], rotation[1]);

      clearOverlay();

      if (isOrtho) {
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        const { uProjection, aUV } = orthoLocations;

        const aspect = canvas.width / canvas.height;
        const d3Radius = scale;
        const worldHalfHeight = canvas.height / 2;
        const size = worldHalfHeight / d3Radius;
        const projectionWebGL = orthographic(size, aspect);
        gl.uniformMatrix4fv(uProjection, false, projectionWebGL);

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.enableVertexAttribArray(aUV);
        gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        const { aScreenPos, uViewport, uScale } = equirectLocations;

        gl.uniform2f(uViewport, canvas.width, canvas.height);
        gl.uniform1f(uScale, scale);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
        gl.enableVertexAttribArray(aScreenPos);
        gl.vertexAttribPointer(aScreenPos, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);
        gl.drawElements(gl.TRIANGLES, quadIndices.length, gl.UNSIGNED_SHORT, 0);
      }
    }

    const cleanUp = () => {
      cleanUpOrthoProgram();
      cleanUpEquirectProgram();
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteTexture(texture);
    };

    overlayControllerRef.current = {
      deactivateOverlay,
      setupTexture,
      drawOverlay,
      cleanUp,
    };

    return () => {
      cleanUp();
    };
  }, [overlayCanvasRef]);

  return overlayControllerRef.current;
};

export default useOverlayController;
