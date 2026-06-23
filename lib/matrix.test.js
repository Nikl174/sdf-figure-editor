/// <reference lib="deno.ns" />
import { mat3, mat4, vec3, vec4 } from "./matrix.js"; // adjust path as needed

Deno.test("vec4.create initializes to zeros", () => {
  const v = vec4.create();
  if (v.length !== 4) throw new Error("vec4 length mismatch");
  if (![0, 0, 0, 0].every((n, i) => v[i] === n)) {
    throw new Error("vec4.create did not initialize to zeros");
  }
});

Deno.test("vec4.fromValues sets correct values", () => {
  const v = vec4.fromValues(1, 2, 3, 4);
  if (![1, 2, 3, 4].every((n, i) => v[i] === n)) {
    throw new Error("vec4.fromValues incorrect");
  }
});

Deno.test("vec4.copy copies values", () => {
  const a = vec4.fromValues(5, 6, 7, 8);
  const out = vec4.create();
  vec4.copy(out, a);
  if (![5, 6, 7, 8].every((n, i) => out[i] === n)) {
    throw new Error("vec4.copy failed");
  }
});

Deno.test("vec4.add adds vectors", () => {
  const a = vec4.fromValues(1, 2, 3, 4);
  const b = vec4.fromValues(10, 20, 30, 40);
  const out = vec4.create();
  vec4.add(out, a, b);
  if (![11, 22, 33, 44].every((n, i) => out[i] === n)) {
    throw new Error("vec4.add failed");
  }
});

Deno.test("vec4.subtract subtracts vectors", () => {
  const a = vec4.fromValues(10, 20, 30, 40);
  const b = vec4.fromValues(1, 2, 3, 4);
  const out = vec4.create();
  vec4.subtract(out, a, b);
  if (![9, 18, 27, 36].every((n, i) => out[i] === n)) {
    throw new Error("vec4.subtract failed");
  }
});

Deno.test("vec4.scale scales vector", () => {
  const a = vec4.fromValues(2, 4, 6, 8);
  const out = vec4.create();
  vec4.scale(out, a, 0.5);
  if (![1, 2, 3, 4].every((n, i) => out[i] === n)) {
    throw new Error("vec4.scale failed");
  }
});

Deno.test("vec4.dot computes dot product", () => {
  const a = vec4.fromValues(1, 2, 3, 4);
  const b = vec4.fromValues(2, 3, 4, 5);
  const d = vec4.dot(a, b);
  if (d !== (1 * 2 + 2 * 3 + 3 * 4 + 4 * 5)) {
    throw new Error("vec4.dot failed");
  }
});

//
// mat4 tests
//

Deno.test("mat4.create creates identity matrix", () => {
  const m = mat4.create();
  const expected = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  ];
  if (!expected.every((n, i) => m[i] === n)) {
    throw new Error("mat4.create did not create identity");
  }
});

Deno.test("mat4.fromValues sets correct values", () => {
  const m = mat4.fromValues(
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
  );
  const expected = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
  ];
  if (!expected.every((n, i) => m[i] === n)) {
    throw new Error("mat4.fromValues incorrect");
  }
});

Deno.test("mat4.copy copies matrix", () => {
  const a = mat4.fromValues(
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
  );
  const out = mat4.create();
  mat4.copy(out, a);
  if (!a.every((n, i) => out[i] === n)) {
    throw new Error("mat4.copy failed");
  }
});

Deno.test("mat4.identity resets matrix to identity", () => {
  const m = mat4.fromValues(
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
    9,
  );
  mat4.identity(m);
  const expected = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  ];
  if (!expected.every((n, i) => m[i] === n)) {
    throw new Error("mat4.identity failed");
  }
});

Deno.test("mat4.multiply multiplies matrices", () => {
  const a = mat4.fromValues(
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
  );
  const b = mat4.fromValues(
    2,
    0,
    0,
    0,
    0,
    2,
    0,
    0,
    0,
    0,
    2,
    0,
    0,
    0,
    0,
    2,
  );
  const out = mat4.create();
  mat4.multiply(out, a, b);

  const expected = a.map((n) => n * 2);
  if (!expected.every((n, i) => out[i] === n)) {
    throw new Error("mat4.multiply failed");
  }
});

Deno.test("mat4.transformVec4 transforms vector", () => {
  const m = mat4.fromValues(
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    10,
    20,
    30,
    1,
  );
  const v = vec4.fromValues(1, 2, 3, 1);
  const out = vec4.create();
  mat4.transformVec4(out, m, v);

  const expected = [11, 22, 33, 1];
  if (!expected.every((n, i) => out[i] === n)) {
    throw new Error("mat4.transformVec4 failed");
  }
});

Deno.test("mat4.translate applies translation", () => {
  const m = mat4.create();
  const out = mat4.create();
  mat4.translate(out, m, vec3.fromValues(5, 6, 7));

  const expected = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    5,
    6,
    7,
    1,
  ];
  if (!expected.every((n, i) => out[i] === n)) {
    throw new Error("mat4.translate failed");
  }
});

Deno.test("mat4.scale scales matrix", () => {
  const m = mat4.create();
  const out = mat4.create();
  mat4.scale(out, m, vec3.fromValues(2, 3, 4));

  const expected = [
    2,
    0,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    0,
    4,
    0,
    0,
    0,
    0,
    1,
  ];
  if (!expected.every((n, i) => out[i] === n)) {
    throw new Error("mat4.scale failed");
  }
});

// Helper: generate a random mat4
function randomMat4() {
  const m = mat4.create();
  for (let i = 0; i < 16; i++) {
    m[i] = (Math.random() * 20) - 10; // range -10..10
  }
  return m;
}

// Reference implementation (naive, correct)
/**
 * @param {mat4} a
 * @param {mat4} b
 */
function multiplyReferenceMat4(a, b) {
  const out = mat4.create();
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row + k * 4] * b[k + col * 4];
      }
      out[row + col * 4] = sum;
    }
  }
  return out;
}

Deno.test("mat4.multiply 50 random tests", () => {
  for (let i = 0; i < 50; i++) { // run 50 random cases
    const a = randomMat4();
    const b = randomMat4();

    const out = mat4.create();
    mat4.multiply(out, a, b);

    const expected = multiplyReferenceMat4(a, b);

    for (let j = 0; j < 16; j++) {
      const diff = Math.abs(out[j] - expected[j]);
      if (diff > 1e-5) {
        throw new Error(
          `Random test failed at iteration ${i}, index ${j}: got ${
            out[j]
          }, expected ${expected[j]}`,
        );
      }
    }
  }
});

// Helper: generate a random mat3
function randomMat3() {
  const m = mat3.create();
  for (let i = 0; i < 9; i++) {
    m[i] = (Math.random() * 20) - 10; // range -10..10
  }
  return m;
}

// Reference implementation (naive, correct)
/**
 * @param {mat3} a
 * @param {mat3} b
 */
function multiplyReferenceMat3(a, b) {
  const out = mat3.create();
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        // column-major indexing: index = row + col*3
        sum += a[row + k * 3] * b[k + col * 3];
      }
      out[row + col * 3] = sum;
    }
  }
  return out;
}

Deno.test("mat3.multiply 50 random tests", () => {
  for (let i = 0; i < 50; i++) {
    const a = randomMat3();
    const b = randomMat3();

    const out = mat3.create();
    mat3.multiply(out, a, b);

    const expected = multiplyReferenceMat3(a, b);

    for (let j = 0; j < 9; j++) {
      const diff = Math.abs(out[j] - expected[j]);
      if (diff > 1e-5) {
        throw new Error(
          `Random test failed at iteration ${i}, index ${j}: got ${
            out[j]
          }, expected ${expected[j]}`,
        );
      }
    }
  }
});

/** @brief Helper: compare with tolerance
 *
 * @param {mat3} a first array to compare
 * @param {mat3} b second array to compare
 */
function assertAlmostEqualsArray(a, b, eps = 1e-5) {
  for (let i = 0; i < a.length; i++) {
    const diff = Math.abs(a[i] - b[i]);
    if (diff > eps) {
      throw new Error(
        `Mismatch at index ${i}: got ${a[i]}, expected ${b[i]}`
      );
    }
  }
}

const I = mat3.fromValues(
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
);

const Z = mat3.fromValues(
  0, 0, 0,
  0, 0, 0,
  0, 0, 0
);

Deno.test("mat3.multiply: identity * A = A", () => {
  const A = mat3.fromValues(
    2, 3, 5,
    7, 11, 13,
    17, 19, 23
  );

  const out = mat3.create();
  mat3.multiply(out, I, A);

  assertAlmostEqualsArray(out, A);
});

Deno.test("mat3.multiply: A * identity = A", () => {
  const A = mat3.fromValues(
    -4, 2, 9,
    1, 0, 3,
    8, 7, -6
  );

  const out = mat3.create();
  mat3.multiply(out, A, I);

  assertAlmostEqualsArray(out, A);
});

Deno.test("mat3.multiply: zero * A = zero", () => {
  const A = mat3.fromValues(
    3, 1, 4,
    1, 5, 9,
    2, 6, 5
  );

  const out = mat3.create();
  mat3.multiply(out, Z, A);

  assertAlmostEqualsArray(out, Z);
});

Deno.test("mat3.multiply: A * zero = zero", () => {
  const A = mat3.fromValues(
    10, -3, 2,
    4, 8, 1,
    7, 0, -5
  );

  const out = mat3.create();
  mat3.multiply(out, A, Z);

  assertAlmostEqualsArray(out, Z);
});

Deno.test("mat3.multiply: known matrix multiplication", () => {
  const A = mat3.fromValues(
    1, 2, 3,
    4, 5, 6,
    7, 8, 9
  );

  const B = mat3.fromValues(
    9, 8, 7,
    6, 5, 4,
    3, 2, 1
  );

  const expected = mat3.fromValues(
    30, 24, 18,
    84, 69, 54,
    138, 114, 90
  );

  const out = mat3.create();
  mat3.multiply(out, B, A);

  assertAlmostEqualsArray(out, expected);
});

Deno.test("mat3.multiply: multiplication is not commutative", () => {
  const A = mat3.fromValues(
    1, 2, 3,
    0, 1, 4,
    5, 6, 0
  );

  const B = mat3.fromValues(
    -2, 1, 0,
    3, 0, 1,
    4, -1, 2
  );

  const AB = mat3.create();
  const BA = mat3.create();

  mat3.multiply(AB, A, B);
  mat3.multiply(BA, B, A);

  let same = true;
  for (let i = 0; i < 9; i++) {
    if (Math.abs(AB[i] - BA[i]) > 1e-5) {
      same = false;
      break;
    }
  }

  if (same) {
    throw new Error("A*B unexpectedly equals B*A");
  }
});

Deno.test("mat3.multiply: supports in-place multiplication (out === a)", () => {
  const A = mat3.fromValues(
    2, 1, 0,
    1, 3, 2,
    4, 0, 1
  );

  const B = mat3.fromValues(
    1, 2, 3,
    0, 1, 4,
    5, 6, 0
  );

  const expected = mat3.create();
  mat3.multiply(expected, A, B);

  const out = A; // in-place
  mat3.multiply(out, out, B);

  assertAlmostEqualsArray(out, expected);
});

Deno.test("mat3.multiply: supports in-place multiplication (out === b)", () => {
  const A = mat3.fromValues(
    3, 1, 4,
    1, 5, 9,
    2, 6, 5
  );

  const B = mat3.fromValues(
    8, 7, 6,
    5, 4, 3,
    2, 1, 0
  );

  const expected = mat3.create();
  mat3.multiply(expected, A, B);

  const out = B; // in-place
  mat3.multiply(out, A, out);

  assertAlmostEqualsArray(out, expected);
});
