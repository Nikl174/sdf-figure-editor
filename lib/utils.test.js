/// <reference lib="deno.ns" />
import { Serializable } from "./utils.js";

class Person extends Serializable {
  /**
   * @override
   */
  static schema = {
    name: "string",
    age: "number",
    childs: [Person],
  };

  constructor() {
    super();
    this.name = "";
    this.age = 0;
    this.childs = [];
  }
}

Deno.test("Serializable: basic object deserialization does not throw", () => {
  const obj = { name: "Eve", age: 42, childs: [] };

  // If this throws, the test fails automatically.
  Person.fromJSON(obj);
});

Deno.test("Serializable: nested objects do not throw", () => {
  const obj = {
    name: "Eve",
    age: 42,
    childs: [
      { name: "Alice", age: 30, childs: [] },
      { name: "Bob", age: 25, childs: [] },
    ],
  };

  Person.fromJSON(obj);
});

Deno.test("Serializable: throws on wrong type", () => {
  const obj = { name: "Eve", age: "not-a-number", childs: [] };

  let threw = false;
  try {
    Person.fromJSON(obj);
  } catch (_) {
    threw = true;
  }
  if (!threw) throw new Error("Expected fromJSON to throw on wrong type");
});

Deno.test("Serializable: throws on missing required field", () => {
  const obj = { age: 42, childs: [] };

  let threw = false;
  try {
    Person.fromJSON(obj);
  } catch (_) {
    threw = true;
  }
  if (!threw) throw new Error("Expected fromJSON to throw on missing field");
});

Deno.test("Serializable: throws on array type mismatch", () => {
  const obj = {
    name: "Eve",
    age: 42,
    childs: ["not-an-object"],
  };

  let threw = false;
  try {
    Person.fromJSON(obj);
  } catch (_) {
    threw = true;
  }
  if (!threw) throw new Error("Expected fromJSON to throw on invalid array element");
});

Deno.test("Serializable: extra fields allowed (if your implementation ignores them)", () => {
  const obj = {
    name: "Eve",
    age: 42,
    childs: [],
    extra: "unexpected",
  };

  // If your implementation rejects extra fields, wrap this in a try/catch like above.
  Person.fromJSON(obj);
});

