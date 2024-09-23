import { describe, expectTypeOf, it } from "vitest";
import { Base64, defineCollection, InferNativeType } from ".";

describe("defineCollection tests", () => {
  it("can't have an optional default sorting field", () => {
    defineCollection({
      name: "test",
      fields: {
        field: {
          type: "string",
          optional: true,
          sort: true,
          name: "field",
        },
      },
      // @ts-expect-error This is erroring as expected
      default_sorting_field: "field",
    });
  });
  it("can't have a string that's not sorted as a default sorting field", () => {
    defineCollection({
      name: "test",
      fields: {
        field: {
          type: "string",
          name: "field",
        },
      },
      // @ts-expect-error This is erroring as expected
      default_sorting_field: "field",
    });
  });
  it("can't have a num field as a default sorting field", () => {
    defineCollection({
      name: "test",
      fields: {
        field: {
          type: "int32",
          sort: false,
          name: "field",
        },
      },
      // @ts-expect-error This is erroring as expected
      default_sorting_field: "field",
    });
  });
  it("can have a num field as a default sorting field", () => {
    defineCollection({
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
    defineCollection({
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
    // @ts-expect-error This is erroring as expected
    defineCollection({
      name: "test",
      fields: {
        field: {
          type: "object",
          name: "field",
        },
      },
    });

    defineCollection({
      name: "test",
      fields: {
        field: {
          type: "object",
          name: "field",
        },
      },
      // @ts-expect-error This is erroring as expected
      enable_nested_fields: false,
    });
  });
  it("can have a nested object field with nested fields enabled", () => {
    defineCollection({
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
    defineCollection({
      name: "test",
      fields: {
        field: {
          // @ts-expect-error This is erroring as expected
          type: "float",
          // @ts-expect-error This is erroring as expected
          name: "not_field",
        },
      },
    });
  });
  it("can't have a non-indexed-field facetted by", () => {
    defineCollection({
      name: "test",
      fields: {
        // @ts-expect-error This is erroring as expected
        field: {
          type: "string",
          name: "field",
          index: false,
          facet: true,
        },
      },
    });
  });
  it("can have a non-index field sorted by", () => {
    defineCollection({
      name: "test",
      fields: {
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
    defineCollection({
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
    defineCollection({
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
  it("can have an embedding field", () => {
    defineCollection({
      name: "test",
      fields: {
        field: {
          type: "string",
          name: "field",
        },
        field2: {
          name: "field2",
          type: "float[]",
          embed: {
            from: ["field"],
            model_config: {
              model_name: "test",
            },
          },
        },
      },
    });
  });
  it("can't have an embedding field with a type other than float[]", () => {
    defineCollection({
      name: "test",
      fields: {
        field: {
          type: "string",
          name: "field",
        },
        field2: {
          name: "field2",
          type: "string",
          embed: {
            // @ts-expect-error This is erroring as expected
            from: ["field"],
            model_config: {
              model_name: "test",
            },
          },
        },
      },
    });
  });
});

describe("InferNativeType tests", () => {
  it("can infer the native type of a string", () => {
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
    const schema = defineCollection({
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
