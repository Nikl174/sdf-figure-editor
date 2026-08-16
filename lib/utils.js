import { mat3, vec3 } from "./matrix.js";

// ---------------------------
// WebGL-Helper
// ---------------------------

/**
 * @brief creates a shader of the given type and compiles it
 *
 * @param {WebGL2RenderingContext} gl WebGL render context
 * @param {GLenum} type glsl file type (vertex, fragment)
 * @param {string} source source string of glsl file
 *
 * @throws {Error} when compiling the shader failed
 * @throws {TypeError} when creating the shader failed
 *
 * @return {WebGLShader} the compiled shader or null on error
 */
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // check for wrong type or other error
  if (shader == null) {
    throw new TypeError(
      "Error while creating the shader of type '${type}', source: ${source}",
    );
  }
  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
    );
    gl.deleteShader(shader);
    throw new Error(`An error occurred compiling the shaders.`);
  }

  return shader;
}

/**
 * @brief Initialise gl context, compiling and loading the shader
 * @param {WebGL2RenderingContext} gl WebGL render context
 * @param {string} vs_src vertex shader string
 * @param {string} fs_src fragment shader string
 *
 * @throws {Error} when creating and linking the shader program failed
 *
 * @returns {WebGLProgram} gl program or null on error
 */
export function initShaderProgram(gl, vs_src, fs_src) {
  // show loaded file in console
  // console.log(vs_src);
  // console.log(fs_src);

  // load glsl files and associate with shader type
  const vertex_shader = loadShader(gl, gl.VERTEX_SHADER, vs_src);
  const fragment_shader = loadShader(gl, gl.FRAGMENT_SHADER, fs_src);

  // add shader to a program and link it together
  const shader_prog = gl.createProgram();
  gl.attachShader(shader_prog, vertex_shader);
  gl.attachShader(shader_prog, fragment_shader);
  gl.linkProgram(shader_prog);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shader_prog, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${
        gl.getProgramInfoLog(shader_prog)
      }`,
    );
    throw new Error(`Unable to initialize the shader program:`);
  }

  return shader_prog;
}

/**
 * @brief returns the location of the unified variables inside of GLSL shader
 *
 * @param {WebGL2RenderingContext} gl webgl render context
 * @param {WebGLProgram} shader_prog compiled shader program the location of the variables is taken from
 * @param {string[]} var_names names of the variables inside of the shader_prog
 *
 * @return {Map<string, WebGLUniformLocation|null>} the resulting map with variable names and locations, null if not found in the shader_prog
 */
export function getVariableLocations(gl, shader_prog, var_names) {
  /** @type {Map<string, WebGLUniformLocation|null>} */
  let loc = new Map();

  // go through list and get location of each var in the shader
  for (let i = 0, len = var_names.length; i < len; i++) {
    const name = var_names[i];
    const var_loc = gl.getUniformLocation(shader_prog, name);
    if (var_loc != null) {
      loc.set(name, var_loc);
    } else {
      console.warn("Location of variable '", name, "' not found in shader.");
      loc.set(name, null);
    }
  }
  return loc;
}

/** @brief Initialise buffer content for vertices needed to draw, in this case only a canvas to draw on with the fragment shader
 * @param {WebGL2RenderingContext} gl render context
 */
export function initVerticeBufferRayMarching(gl) {
  // Init vertice buffers, just 2 vertices to allow the fragment shader to show

  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();
  // The array of positions for the square.
  const positions = [
    1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
    -1.0,
    -1.0,
    -1.0,
  ];

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(positions),
    gl.STATIC_DRAW,
  );

  { // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    const numComponents = 2; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from

    // use the first buffer currently bound with above properties
    gl.vertexAttribPointer(
      0,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    // also enable the vertices to use them in the shader
    gl.enableVertexAttribArray(0);
  }
}

/**
 * TODO replace with rotation matrix
 * @brief calculate rotation arround a point
 *
 * @param {number} dist distance to camera
 * @param {number} radian the radian number describing the current rotation arround the 0-point
 * @param {number} yPos y position of the calculated position
 * @return {vec3} new rotated position from the middle point
 */
export function rotatedPos(dist, radian, yPos) {
  return vec3.fromValues(
    Math.sin(radian) * dist, //   camPosZX_rad =   0deg -> (0,  0,  e) -> on pos. z axis
    yPos, //   camPosZX_rad =  90deg -> (e,  0,  0)
    Math.cos(radian) * dist, //   camPosZX_rad = 180deg -> (0,  0, -e) -> on neg. z axis
  );
}

// -----------------------
// Spherical Coordinate helper
// -----------------------

/**
 * @brief Convert spherical coordniates (r, phi, theta) to standard Cartesian format (x, y, z)
 * @param {SphereCoordinates} sc sphere coordniates to convert
 * @return {vec3} converted Cartesian one
 */
export function sphericalToCatesianCoordinates(sc) {
  const sin_p = Math.sin(sc.phi);
  const cos_p = Math.cos(sc.phi);
  const sin_t = Math.sin(sc.theta);
  const cos_t = Math.cos(sc.theta);
  return vec3.fromValues(
    sc.radius * sin_t * cos_p,
    sc.radius * sin_t * sin_p,
    sc.radius * cos_t,
  );
}

/**
 * @typedef {{radius: number, theta: number, phi: number}} SphereCoordinates
 * @typedef {{x: number, y: number, z: number}} CartesianCoordinates
 */

/**
 * @brief Encode a spherical vector into a normal vec3
 * @param {SphereCoordinates} vec sphere coordniates
 * @return {vec3} vec3 representation
 */
export function sphericalToVec3(vec) {
  return vec3.fromValues(vec.radius, vec.theta, vec.phi);
}

/**
 * @brief Decode a vec3 as a spherical vector
 * @param {vec3} vec sphere coordinates as vec3 representation
 * @return {SphereCoordinates} sphere coordniates representation
 */
export function vec3ToSpherical(vec) {
  return { radius: vec[0], theta: vec[1], phi: vec[2] };
}

/**
 * @brief Get the base vector matrix for a sphere coordinate/vector
 * @param {SphereCoordinates} sc the spherical vector
 * @return {mat3} the matrix that can convert a vector from cartesian coordinates back to the defining spherical coordinate system
 */
export function calcSphericalBaseMatrix(sc) {
  const sin_p = Math.sin(sc.phi);
  const cos_p = Math.cos(sc.phi);
  const sin_t = Math.sin(sc.theta);
  const cos_t = Math.cos(sc.theta);
  // like the output of the function sphericalToCatesianCoordinates()
  // cyclically switch the rows to match the coordinates and rotate for the right-handed coordinate system??
  // NOTE matrix is initialized transposed! see mat3.fromValues()
  // deno-fmt-ignore
  return mat3.fromValues(
  cos_t * cos_p, cos_t * sin_p, -sin_t,  // base vector theta
         -sin_p,         cos_p,      0,  // base vector phi
  sin_t * cos_p, sin_t * sin_p,  cos_t,  // base vector r
    );
}

/**
 * @typedef {'x' | 'y' | 'z'} RotationAxis
 */

/**
 * Creates a 3×3 rotation matrix using glMatrix's mat3.
 *
 * @param {RotationAxis} axis - Axis of rotation ('x', 'y', or 'z').
 * @param {number} angle - Rotation angle in radians.
 * @returns {mat3} A mat3 rotation matrix.
 */
export function mat3Rotation(axis, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  const out = mat3.create();

  switch (axis) {
    // deno-fmt-ignore
    case 'x':
      out[0] = 1; out[3] = 0;  out[6] = 0;
      out[1] = 0; out[4] = c;  out[7] = s;
      out[2] = 0; out[5] = -s; out[8] = c;
      break;
    // deno-fmt-ignore
    case 'y':
      out[0] = c;  out[3] = 0; out[6] = -s;
      out[1] = 0;  out[4] = 1; out[7] = 0;
      out[2] = s;  out[5] = 0; out[8] = c;
      break;
    // deno-fmt-ignore
    case 'z':
      out[0] = c;  out[3] = s;  out[6] = 0;
      out[1] = -s; out[4] = c;  out[7] = 0;
      out[2] = 0;  out[5] = 0;  out[8] = 1;
      break;

    default:
      throw new Error("Axis must be 'x', 'y', or 'z'");
  }

  return out;
}

// --------------------
// TODO UNUSED
// --------------------

/**
 * Swaps two rows of a matrix stored in a flat array
 *
 * This function operates in-place and works for any matrix where rows are
 * contiguous blocks of equal length within the underlying Float32Array.
 * The caller must provide the correct `rowSize` (number of elements per row).
 *
 * @param {Float32Array | number[]} m - The matrix data in flat array form.
 * @param {number} r1 - Index of the first row to swap (0-based).
 * @param {number} r2 - Index of the second row to swap (0-based).
 * @param {number} rowSize - Number of elements in each row (3 for mat3, 4 for mat4).
 *
 * @example
 * // Swap rows in a mat3 (3×3)
 * const M = mat3.fromValues(
 *   1, 2, 3,
 *   4, 5, 6,
 *   7, 8, 9
 * );
 * swapMatrixRows(M, 0, 2, 3);
 *
 * @example
 * // Swap rows in a mat4 (4×4)
 * const M4 = mat4.create();
 * swapMatrixRows(M4, 1, 2, 4);
 */

export function swapMatrixRows(m, r1, r2, rowSize) {
  const start1 = r1 * rowSize;
  const start2 = r2 * rowSize;

  for (let i = 0; i < rowSize; i++) {
    const tmp = m[start1 + i];
    m[start1 + i] = m[start2 + i];
    m[start2 + i] = tmp;
  }
}

/**
 * Swaps two columns of a matrix stored in a flat array (e.g., gl-matrix mat3/mat4).
 *
 * This function operates in-place and works for any matrix where columns are
 * separated by a fixed stride. The caller must provide the correct `rowSize`
 * (number of elements per row) so the function can compute the column stride.
 *
 * @param {Float32Array | number[]} m - The matrix data in flat array form.
 * @param {number} c1 - Index of the first column to swap (0-based).
 * @param {number} c2 - Index of the second column to swap (0-based).
 * @param {number} rowSize - Number of elements in each row (3 for mat3, 4 for mat4).
 *
 * @example
 * // Swap columns in a mat3 (3×3)
 * const M = mat3.fromValues(
 *   1, 2, 3,
 *   4, 5, 6,
 *   7, 8, 9
 * );
 * swapMatrixColumns(M, 0, 2, 3);
 *
 * @example
 * // Swap columns in a mat4 (4×4)
 * const M4 = mat4.create();
 * swapMatrixColumns(M4, 1, 3, 4);
 */

export function swapMatrixColumns(m, c1, c2, rowSize) {
  for (let row = 0; row < rowSize; row++) {
    const i1 = row * rowSize + c1;
    const i2 = row * rowSize + c2;

    const tmp = m[i1];
    m[i1] = m[i2];
    m[i2] = tmp;
  }
}

/**
 * Returns a number whose value is limited to the given range.
 *
 * @param {Number} num the number to limit
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns {Number} A number in the range [min, max]
 */
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}
