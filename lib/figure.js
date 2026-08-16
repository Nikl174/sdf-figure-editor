// ------------------
// Common Types
// ------------------

import { Serializable } from "./Serializable.js";


/**
 * TODO remove
 * @typedef {{x: number, y: number, z: number}} Vec3 a 3 dimensional floating point for the shader
 *
 * TODO
 * @typedef {[number, number, number]} ExtraParam extra floating parameter type for
 */

// ------------------
// Constants
// ------------------

/**
 * TODO
 * @type {number} Number of Parts in a figure
 */
const NUM_OF_PARTS = 24;

/** TODO
 * @type {string}
 */
const FIGURE_SHADER_VAR_NAME = "FigurePartBlock";

/** SDF Primitives Enum available in the shader
 * @enum {number}
 */
export const SDF_PRIMITIES = {
  SDF_NONE: -1,
  SDF_SPHERE: 0,
  SDF_CAPSULE: 1,
  SDF_BEND_CAPSULE: 2,
  SDF_ROUND_CONE: 3,
  SDF_ELLIPSOID: 4,
};

// ------------------
// Class
// ------------------

/**
 * @class Containing informations of one part of the figure used in the shader to render it
 *
 * Used as an array to display multiple SDFs and can be converted to the array structure needed to pass to GLSL Shader
 */
export class SDFPart extends Serializable {
  /**
   * @override
   */
  static schema = {
    "sdf": "number",
    "start_point": "object",
    "end_point": "object",
    "color": "object",
    "smooth_min": "number",
    "extra_param": "object",
  };

  /** TODO
   * @type {number} the 32bit size of the SDFPart structs
   *
   * Means the actual number of bits is:
   *    FIGURE_PART_32BIT_SIZE * 32
   * or in bytes:
   *    FIGURE_PART_32BIT_SIZE * 4
   *  This depends on the alignment of the GLSL Struct
   */
  static FIGURE_PART_32BIT_SIZE = 4 + 4 + 4 + 3 + 1 + 3 * 4;
  /**
   * Constructor for one SDF used to give to the Shader
   * @constructor
   * @param {SDF_PRIMITIES} sdf Signed distance Function to use for part
   * @param {vec3} start_point main x,y,z point, usually where the sdf starts to draw
   * @param {vec3} end_point optional x,y,z end-point the sdf should stop
   * @param {number} smooth_min smooth minimum factor
   * @param {ExtraParam} extra_param extra values used in the specific SDF
   * @param {vec3} color color of the part
   */
  constructor(sdf, start_point, end_point, color, smooth_min, extra_param) {
    super();
    this.sdf = sdf;
    this.start_point = start_point;
    this.end_point = end_point;
    this.color = color;
    this.smooth_min = smooth_min;
    this.extra_param = extra_param;
  }
  /**
   * Convert Datatype to the float representation needed for passing as UBO to the shader
   * @returns {Float32Array} Array in needed structure of one SDFPart of FIGURE_PART_32BIT_SIZE floats
   * TODO
   */
  toGLFloatArray() {
    const buffer = new Float32Array(SDFPart.FIGURE_PART_32BIT_SIZE);

    // WARNING Order is important!
    buffer[0] = this.sdf;
    buffer[4] = this.start_point[0];
    buffer[5] = this.start_point[1];
    buffer[6] = this.start_point[2];
    buffer[8] = this.end_point[0];
    buffer[9] = this.end_point[1];
    buffer[10] = this.end_point[2];
    buffer[12] = this.color[0];
    buffer[13] = this.color[1];
    buffer[14] = this.color[2];
    buffer[15] = this.smooth_min;
    buffer[16] = this.extra_param[0];
    buffer[20] = this.extra_param[1];
    buffer[24] = this.extra_param[2];

    return buffer;
  }
}

// ------------------
// WebGL related
// ------------------

/** Converts an array of figure parts to a 32Bit Float array needed for the shader
 * @param {SDFPart[]} parts the structure of the figure
 * @returns {Float32Array} the buffer used to pass to the shader
 */
function convertSDFPartsToBuffer(parts) {
  // create a buffer containing each individual floating value
  const buffer = new Float32Array(
    NUM_OF_PARTS * SDFPart.FIGURE_PART_32BIT_SIZE,
  );
  const zero_buf = new Float32Array(
    SDFPart.FIGURE_PART_32BIT_SIZE,
  );

  for (let i = 0, len = NUM_OF_PARTS; i < len; i++) {
    // add each parts Float32Arrays in the right order
    if (i >= parts.length) {
      break;
      // buffer.set(zero_buf, i * SDFPart.FIGURE_PART_32BIT_SIZE);
      // continue;
    }
    const part = parts[i].toGLFloatArray();
    buffer.set(part, i * SDFPart.FIGURE_PART_32BIT_SIZE); // offset is current part number * number of floats in one part
  }

  return buffer;
}

/**
 * @param {WebGL2RenderingContext} gl WebGL context needed to create the buffer
 * @param {WebGLProgram} prog
 * @param {SDFPart[]} parts parts to pass into the shader programm
 */
export function updateFigureBuffer(gl, prog, parts) {
  const gl_figure_buffer = gl.createBuffer();
  const parts_buffer = convertSDFPartsToBuffer(parts);
  const parts_loc = gl.getUniformBlockIndex(prog, FIGURE_SHADER_VAR_NAME);

  gl.bindBuffer(gl.UNIFORM_BUFFER, gl_figure_buffer);
  gl.bufferData(gl.UNIFORM_BUFFER, parts_buffer, gl.DYNAMIC_DRAW);
  //TODO
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, gl_figure_buffer);
  gl.useProgram(prog);
  //TODO
  gl.uniformBlockBinding(prog, parts_loc, 0);
}
