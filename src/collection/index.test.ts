import { expectTypeOf, describe, it } from "vitest";
import { Base64, defineCollectionSchema, InferNativeType } from ".";

describe("defineCollectionSchema tests", () => {
  it("can't have an optional default sorting field", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "string",
          optional: true,
          sort: true,
          name: "field",
        },
      },
      // @ts-expect-error
      default_sorting_field: "field",
    });
  });
  it("can't have a string that's not sorted as a default sorting field", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "string",
          name: "field",
        },
      },
      // @ts-expect-error
      default_sorting_field: "field",
    });
  });
  it("can't have a num field as a default sorting field", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "int32",
          sort: false,
          name: "field",
        },
      },
      // @ts-expect-error
      default_sorting_field: "field",
    });
  });
  it("can have a num field as a default sorting field", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "int32",
          name: "field",
        },
      },
      default_sorting_field: "field",
    });
  });
  it("can have a string field that's sorted as a default sorting field", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "string",
          sort: true,
          name: "field",
        },
      },
      default_sorting_field: "field",
    });
  });
  it("can't have a nested object field without nested fields enabled", () => {
    // @ts-expect-error
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "object",
          name: "field",
        },
      },
    });

    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "object",
          name: "field",
        },
      },
      // @ts-expect-error
      enable_nested_fields: false,
    });
  });
  it("can have a nested object field with nested fields enabled", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "object",
          name: "field",
        },
      },
      enable_nested_fields: true,
    });
  });
  it("can't have a field's name not matching the key", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          // @ts-expect-error
          type: "string",
          // @ts-expect-error
          name: "not_field",
        },
      },
    });
  });
  it("can't have a non-indexed-field facetted by", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        // @ts-expect-error
        field: {
          type: "string",
          name: "field",
          index: false,
          facet: true,
        },
      },
    });
  });
  it("can't have a non-index field sorted by", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        // @ts-expect-error
        field: {
          type: "string",
          name: "field",
          index: false,
          sort: true,
        },
      },
    });
  });
  it("can have a facet set to true if the index is undefined or true", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "string",
          name: "field",
          index: true,
          facet: true,
        },
        field2: {
          type: "string",
          name: "field2",
          facet: true,
        },
      },
    });
  });
  it("can have a sort set to true if the index is undefined or true", () => {
    defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "string",
          name: "field",
          index: true,
          sort: true,
        },
        field2: {
          type: "string",
          name: "field2",
          sort: true,
        },
      },
    });
  });
});

describe("InferNativeType tests", () => {
  it("can infer the native type of a string", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "string",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: string }>();
  });
  it("can infer the native type of a string array", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "string[]",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: string[] }>();
  });
  it("can infer the native type of an int32", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "int32",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: number }>();
  });
  it("can infer the native type of a int32 array", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "int32[]",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: number[] }>();
  });
  it("can infer the native type of an int64", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "int64",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: number }>();
  });
  it("can infer the native type of a int64 array", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "int64[]",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: number[] }>();
  });
  it("can infer the native type of a float", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "float",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: number }>();
  });
  it("can infer the native type of a float array", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "float[]",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: number[] }>();
  });
  it("can infer the native type of a boolean", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "bool",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: boolean }>();
  });
  it("can infer the native type of a boolean array", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "bool[]",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: boolean[] }>();
  });
  it("can infer the native type of an geopoint", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "geopoint",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{
      field: [number, number];
    }>();
  });
  it("can infer the native type of an geopoint array", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "geopoint[]",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{
      field: [number, number][];
    }>();
  });
  it("can infer the native type of an auto", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "auto",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{
      field: unknown;
    }>();
  });
  it("can infer the native type of a wildcard string", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "string*",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: string }>();
  });
  it("can infer the native type of a base64 encoded image", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "image",
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{ field: Base64 }>();
  });
  it("can infer optional fields", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "string",
          optional: true,
          name: "field",
        },
      },
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{
      field: string | undefined;
    }>();
  });
  it("can infer the native type of an object with no children keys", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "object",
          name: "field",
        },
      },
      enable_nested_fields: true,
    });
    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{
      field: never;
    }>();
  });
  it("can infer the native type of an object with children keys", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "object",
          name: "field",
        },
        "field.child": {
          type: "string",
          name: "field.child",
        },
        "field.child2": {
          type: "object",
          name: "field.child2",
        },
        "field.child2.child": {
          type: "string",
          name: "field.child2.child",
        },
      },
      enable_nested_fields: true,
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{
      field: {
        child: string;
        child2: {
          child: string;
        };
      };
    }>();
  });
  it("can infer the native type of an object with children keys and optional fields", () => {
    const schema = defineCollectionSchema({
      name: "test",
      fields: {
        field: {
          type: "object",
          name: "field",
        },
        "field.child": {
          type: "string",
          name: "field.child",
        },
        "field.child2": {
          type: "object",
          name: "field.child2",
        },
        "field.child2.child": {
          type: "string",
          name: "field.child2.child",
          optional: true,
        },
      },
      enable_nested_fields: true,
    });

    expectTypeOf<InferNativeType<typeof schema.fields>>().toEqualTypeOf<{
      field: {
        child: string;
        child2: {
          child: string | undefined;
        };
      };
    }>();
  });
});
