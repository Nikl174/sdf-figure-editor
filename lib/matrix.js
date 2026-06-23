/**
 * @typedef {Float32Array & { length: 4 }} vec4
 * @typedef {Float32Array & { length: 16 }} mat4
 * @typedef {Float32Array & { length: 3 }} vec3
 * @typedef {Float32Array & { length: 9 }} mat3
 */

// vec3 library compatible with glMatrix.js
export const vec3 = {
  /**
   * Creates a new vec3.
   * @returns {vec3}
   */
  create() {
    return /** @type {vec3} */ (new Float32Array(3));
  },

  /**
   * Creates a new vec3 from values.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {vec3}
   */
  fromValues(x, y, z) {
    return /** @type {vec3} */ (new Float32Array([x, y, z]));
  },

  /**
   * Copy a → out.
   * @param {vec3} out
   * @param {vec3} a
   * @returns {vec3}
   */
  copy(out, a) {
    out.set(a);
    return out;
  },

  /**
   * Add vectors.
   * @param {vec3} out
   * @param {vec3} a
   * @param {vec3} b
   * @returns {vec3}
   */
  add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  },

  /**
   * Subtract vectors. a - b
   * @param {vec3} out
   * @param {vec3} a
   * @param {vec3} b
   * @returns {vec3}
   */
  subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  },

  /**
   * Scale vector.
   * @param {vec3} out
   * @param {vec3} a
   * @param {number} s
   * @returns {vec3}
   */
  scale(out, a, s) {
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    return out;
  },

  /**
   * Dot product.
   * @param {vec3} a
   * @param {vec3} b
   * @returns {number}
   */
  dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },
};

// 3x3 Matrix library compatible with glMatrix.js
export const mat3 = {
  /**
   * Create identity matrix.
   * @returns {mat3}
   */
  create() {
    const m = new Float32Array(9);
    m[0] = 1;
    m[4] = 1;
    m[8] = 1;
    return /** @type {mat3} */ (m);
  },

  /**
   * Creates a new mat3 initialized with the given values.
   *
   * m00, m10, m20,
   * m01, m11, m21,
   * m02, m12, m22
   * @param {number} m00
   * @param {number} m01
   * @param {number} m02
   * @param {number} m10
   * @param {number} m11
   * @param {number} m12
   * @param {number} m20
   * @param {number} m21
   * @param {number} m22
   * @returns {mat3} A new 3×3 matrix
   */
  //deno-fmt-ignore
  fromValues(
    m00, m01, m02,
    m10, m11, m12,
    m20, m21, m22
  ) {
    const m = mat3.create();
    m[0] = m00; m[3] = m10; m[6] = m20;
    m[1] = m01; m[4] = m11; m[7] = m21;
    m[2] = m02; m[5] = m12; m[8] = m22;
    return /** @type {mat3} */ m;
  },

  /**
   * Copy a → out.
   * @param {mat3} out
   * @param {mat3} a
   * @returns {mat3}
   */
  copy(out, a) {
    out.set(a);
    return out;
  },

  /**
   * Set identity.
   * @param {mat3} out
   * @returns {mat3}
   */
  identity(out) {
    out.fill(0);
    out[0] = 1;
    out[4] = 1;
    out[8] = 1;
    return out;
  },

  /**
   * Multiply matrices a * b → out.
   * @param {mat3} out
   * @param {mat3} a
   * @param {mat3} b
   * @returns {mat3}
   */
  multiply(out, a, b) {
    const a00 = a[0],
      a01 = a[1],
      a02 = a[2];
    const a10 = a[3],
      a11 = a[4],
      a12 = a[5];
    const a20 = a[6],
      a21 = a[7],
      a22 = a[8];
    const b00 = b[0],
      b01 = b[1],
      b02 = b[2];
    const b10 = b[3],
      b11 = b[4],
      b12 = b[5];
    const b20 = b[6],
      b21 = b[7],
      b22 = b[8];
    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;
    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;
    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
  },

  /**
   * Transform vec3 by matrix.
   * @param {vec3} out
   * @param {mat3} m
   * @param {vec3} v
   * @returns {vec3}
   */
  transformVec3(out, m, v) {
    const x = v[0], y = v[1], z = v[2];

    out[0] = m[0] * x + m[3] * y + m[6] * z;
    out[1] = m[1] * x + m[4] * y + m[7] * z;
    out[2] = m[2] * x + m[5] * y + m[8] * z;

    return out;
  },

  /**
   * Transpose a mat3.
   * @param {mat3} out
   * @param {mat3} a
   * @returns {mat3}
   */
  transpose(out, a) {
    // Handle in-place transpose
    if (out === a) {
      out[1] = a[3];
      out[2] = a[6];
      out[3] = a[1];
      out[5] = a[7];
      out[6] = a[2];
      out[7] = a[5];
    } else {
      out[0] = a[0];
      out[1] = a[3];
      out[2] = a[6];

      out[3] = a[1];
      out[4] = a[4];
      out[5] = a[7];

      out[6] = a[2];
      out[7] = a[5];
      out[8] = a[8];
    }

    return out;
  },
  /**
   * Normalize a mat3.
   * Scales the matrix so its Frobenius length becomes 1.
   *
   * @param {mat3} out the receiving matrix
   * @param {mat3} a the matrix to normalize
   * @returns {mat3} out
   */
  normalize(out, a) {
    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];

    let len = a00 * a00 + a01 * a01 + a02 * a02 +
      a10 * a10 + a11 * a11 + a12 * a12 +
      a20 * a20 + a21 * a21 + a22 * a22;

    if (len > 0) {
      len = 1 / Math.sqrt(len);

      out[0] = a00 * len;
      out[1] = a01 * len;
      out[2] = a02 * len;

      out[3] = a10 * len;
      out[4] = a11 * len;
      out[5] = a12 * len;

      out[6] = a20 * len;
      out[7] = a21 * len;
      out[8] = a22 * len;
    }

    return out;
  },
  /**
   * Add matrices a + b → out.
   * @param {mat3} out
   * @param {mat3} a
   * @param {mat3} b
   * @returns {mat3}
   */
  add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];

    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];

    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];

    return out;
  },

  /**
   * Multiply matrix a by scalar s → out.
   * @param {mat3} out
   * @param {mat3} a
   * @param {number} s
   * @returns {mat3}
   */
  multiplyScalar(out, a, s) {
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;

    out[3] = a[3] * s;
    out[4] = a[4] * s;
    out[5] = a[5] * s;

    out[6] = a[6] * s;
    out[7] = a[7] * s;
    out[8] = a[8] * s;

    return out;
  },
};

// vec4 library compatible with glMatrix.js
export const vec4 = {
  /**
   * Creates a new vec4.
   * @returns {vec4}
   */
  create() {
    return /** @type {vec4} */ (new Float32Array(4));
  },

  /**
   * Creates a new vec4 from values
   * @param {number} x 1. Value
   * @param {number} y 2. Value
   * @param {number} z 3. Value
   * @param {number} w 4. Value
   * @returns {vec4}
   */
  fromValues(x, y, z, w) {
    return /** @type {vec4} */ (new Float32Array([x, y, z, w]));
  },

  /**
   * Copy a → out.
   * @param {vec4} out
   * @param {vec4} a
   * @returns {vec4}
   */
  copy(out, a) {
    out.set(a);
    return out;
  },

  /**
   * Add vectors.
   * @param {vec4} out
   * @param {vec4} a
   * @param {vec4} b
   * @returns {vec4}
   */
  add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
  },

  /**
   * Subtract vectors. a-b
   * @param {vec4} out
   * @param {vec4} a
   * @param {vec4} b
   * @returns {vec4}
   */
  subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
  },

  /**
   * Scale vector.
   * @param {vec4} out
   * @param {vec4} a
   * @param {number} s
   * @returns {vec4}
   */
  scale(out, a, s) {
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    out[3] = a[3] * s;
    return out;
  },

  /**
   * Dot product.
   * @param {vec4} a
   * @param {vec4} b
   * @returns {number}
   */
  dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  },
};

// 4x4 Matrix library compatible with glMatrix.js
export const mat4 = {
  /**
   * Create identity matrix.
   * @returns {mat4}
   */
  create() {
    const m = new Float32Array(16);
    m[0] = 1;
    m[5] = 1;
    m[10] = 1;
    m[15] = 1;
    return /** @type {mat4} */ (m);
  },

  /**
   * Creates a new mat4 initialized with the given values.
   *
   * @param {number} m00
   * @param {number} m01
   * @param {number} m02
   * @param {number} m03
   * @param {number} m10
   * @param {number} m11
   * @param {number} m12
   * @param {number} m13
   * @param {number} m20
   * @param {number} m21
   * @param {number} m22
   * @param {number} m23
   * @param {number} m30
   * @param {number} m31
   * @param {number} m32
   * @param {number} m33
   * @returns {mat4} A new 4×4 matrix
   */
  // deno-fmt-ignore
  fromValues(
    m00, m01, m02, m03,
    m10, m11, m12, m13,
    m20, m21, m22, m23,
    m30, m31, m32, m33
  ) {
    const m = mat4.create();
    m[0]  = m00; m[1]  = m01; m[2]  = m02; m[3]  = m03;
    m[4]  = m10; m[5]  = m11; m[6]  = m12; m[7]  = m13;
    m[8]  = m20; m[9]  = m21; m[10] = m22; m[11] = m23;
    m[12] = m30; m[13] = m31; m[14] = m32; m[15] = m33;
    return /** @type {mat4} */ m;
  },

  /**
   * Copy a → out.
   * @param {mat4} out
   * @param {mat4} a
   * @returns {mat4}
   */
  copy(out, a) {
    out.set(a);
    return out;
  },

  /**
   * Set identity.
   * @param {mat4} out
   * @returns {mat4}
   */
  identity(out) {
    out.fill(0);
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  },

  /**
   * Multiply matrices a * b → out.
   * @param {mat4} out
   * @param {mat4} a
   * @param {mat4} b
   * @returns {mat4}
   */
  multiply(out, a, b) {
    for (let col = 0; col < 4; col++) {
      const bi = col * 4;
      const b0 = b[bi], b1 = b[bi + 1], b2 = b[bi + 2], b3 = b[bi + 3];

      out[bi] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
      out[bi + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
      out[bi + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      out[bi + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
  },

  /**
   * Transform vec4 by matrix.
   * @param {vec4} out
   * @param {mat4} m
   * @param {vec4} v
   * @returns {vec4}
   */
  transformVec4(out, m, v) {
    const x = v[0], y = v[1], z = v[2], w = v[3];

    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;

    return out;
  },

  /**
   * Translate matrix by vector (x,y,z).
   * @param {mat4} out
   * @param {mat4} a
   * @param {vec3} v
   * @returns {mat4}
   */
  translate(out, a, v) {
    const [x, y, z] = v;

    if (out !== a) out.set(a);

    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];

    return out;
  },

  /**
   * Scale matrix by (x,y,z).
   * @param {mat4} out
   * @param {mat4} a
   * @param {vec3} v
   * @returns {mat4}
   */
  scale(out, a, v) {
    const [x, y, z] = v;

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;

    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];

    return out;
  },

  /**
   * Transpose a mat4.
   * @param {mat4} out
   * @param {mat4} a
   * @returns {mat4}
   */
  transpose(out, a) {
    // Handle in-place transpose
    if (out === a) {
      const a01 = a[1], a02 = a[2], a03 = a[3];
      const a12 = a[6], a13 = a[7];
      const a23 = a[11];

      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];

      out[4] = a01;
      out[6] = a[9];
      out[7] = a[13];

      out[8] = a02;
      out[9] = a12;
      out[11] = a[14];

      out[12] = a03;
      out[13] = a13;
      out[14] = a23;
    } else {
      out[0] = a[0];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];

      out[4] = a[1];
      out[5] = a[5];
      out[6] = a[9];
      out[7] = a[13];

      out[8] = a[2];
      out[9] = a[6];
      out[10] = a[10];
      out[11] = a[14];

      out[12] = a[3];
      out[13] = a[7];
      out[14] = a[11];
      out[15] = a[15];
    }

    return out;
  },
};
