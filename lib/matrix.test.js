/// <reference lib="deno.ns" />
import { mat4, vec4 } from "./matrix.js"; // adjust path as needed

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
  mat4.translate(out, m, [5, 6, 7]);

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
  mat4.scale(out, m, [2, 3, 4]);

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
function multiplyReference(a, b) {
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

    const expected = multiplyReference(a, b);

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
