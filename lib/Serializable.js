/**
 * A schema entry can be:
 * - a primitive type string
 * - a Serializable subclass
 * - an array containing exactly one of the above (for homogeneous arrays)
 *
 * @typedef {"string" | "number" | "boolean" | "object"} PrimitiveType
 * @typedef {PrimitiveType | Serializable | [PrimitiveType | Serializable]} SchemaEntry
 * @typedef {Object.<string, SchemaEntry>} SerializableSchema
 */

/**
 * Base class for safely deserializing JSON into class instances with runtime type checking.
 * E.g. Usage:
 * ```javascript
 * class Person extends Serializable {
 *   static schema = {
 *     name: "string",
 *     age: "number",
 *     childs: [Person],
 *   };
 * }
 *
 * const json =
 *   '{"name": "Eve", "age": 42, "childs": [{"name":"Alice","age":30, "childs": []},{"name":"Bob","age":25, "childs": []}]}';
 * const obj = JSON.parse(json);
 * const person = Person.fromJSON(obj);
 * ```
 */
export class Serializable {
  /**
   * Subclasses override this with their schema.
   * Describe the variables and its types used to serialize.
   * @type {SerializableSchema}
   */
  static schema = {};

  /**
   * Create an instance of the subclass from a plain JSON object.
   *
   * @template T
   * @this {new () => T}
   * @param {Object} obj the javascript object to parse
   * @returns {T} an instance of the parsed object
   * @throws {Error} When parsing the JSON string failes or an schema definition error happened
   */
  static fromJSON(obj) {
    if (typeof obj !== "object") {
      throw new Error(
        "Invalid JSON: expected an object! (Use JSON.parse(string) before)",
      );
    }

    /** @type {T} */
    const instance = new this();

    // @ts-ignore: 'schema' exists in T, because it is Serializable
    for (const [key, expected] of Object.entries(this.schema)) {
      if (!(key in obj)) {
        throw new Error(`Missing field '${key}'`);
      }
      // TODO not nice, runes every time
      // if (!(key in instance)) {
      //   throw new Error(`Schema error for key '${key}', not in actual object`);
      // }

      // @ts-ignore: checked before, if key is in obj
      const value = obj[key];

      //
      // CASE 1: Primitive type
      //
      if (typeof expected === "string") {
        if (typeof value !== expected) {
          throw new Error(
            `Invalid type for '${key}': expected ${expected}, got ${typeof value}`,
          );
        }
        // @ts-ignore: checked if schema type in object instance
        instance[key] = value;
        continue;
      }

      //
      // CASE 2: Array schema
      //
      if (Array.isArray(expected)) {
        const inner = expected[0];

        if (!Array.isArray(value)) {
          throw new Error(`Field '${key}' must be an array`);
        }
        // TODO not nice
        if (value.length == 0) {
          // @ts-ignore: checked if schema type in object instance
          instance[key] = null;
          continue;
        }

        // @ts-ignore: checked if schema type in object instance
        instance[key] = value.map((item, index) => {
          // array of primitives
          if (typeof inner === "string") {
            if (typeof item !== inner) {
              throw new Error(
                `Invalid type in array '${key}' at index ${index}: expected ${inner}`,
              );
            }
            return item;
          }

          // array of Serializable subclasses
          if (
            typeof inner === "function" &&
            inner.prototype instanceof Serializable
          ) {
            return inner.fromJSON(item);
          }

          throw new Error(`Invalid schema for array field '${key}'`);
        });

        continue;
      }

      //
      // CASE 3: Nested Serializable subclass
      //
      if (
        typeof expected === "function" &&
        expected.prototype instanceof Serializable
      ) {
        // @ts-ignore: checked if schema type in object instance
        instance[key] = value === null ? null : expected.fromJSON(value);
        continue;
      }

      throw new Error(`Invalid schema definition for field '${key}'`);
    }

    return instance;
  }
}
