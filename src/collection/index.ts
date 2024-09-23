import type { Branded } from "~/lib/utils";

type Base64 = Branded<string, "Base64">;

type FieldType =
  | "string"
  | "int32"
  | "int64"
  | "float"
  | "bool"
  | "geopoint"
  | "geopoint[]"
  | "string[]"
  | "int32[]"
  | "int64[]"
  | "float[]"
  | "bool[]"
  | "object"
  | "object[]"
  | "auto"
  | "string*"
  | "image";

/**
 * A type that represents a valid document schema.
 */
type DocumentSchema = {
  [K in string]: FieldType | DocumentSchema;
};

/**
 * A type that maps field types to their native types.
 */
type FieldTypeToNativeTypeMap = {
  string: string;
  int32: number;
  int64: number;
  float: number;
  bool: boolean;
  geopoint: [number, number];
  "geopoint[]": [number, number][];
  "string[]": string[];
  "int32[]": number[];
  "int64[]": number[];
  "float[]": number[];
  "bool[]": boolean[];
  auto: unknown;
  "string*": string;
  image: Base64;
};

/**
 * A type that infers the native type of a field.
 * @template T The field.
 */
type InferNativeTypeForField<T extends CollectionField> =
  T["optional"] extends true ?
    FieldTypeToNativeTypeMap[T["type"] & keyof FieldTypeToNativeTypeMap] | undefined
  : FieldTypeToNativeTypeMap[T["type"] & keyof FieldTypeToNativeTypeMap];

/**
 * A type that infers the native type of a field schema.
 * @template T The collection's fields.
 * @template Prefix The prefix used for nested objects.
 */
type InferNativeType<T extends Record<string, CollectionField>, Prefix extends string = ""> = {
  [K in keyof T as K extends `${Prefix}${infer Key}` ?
    Key extends `${infer Parent}.${string}` ?
      Parent
    : Key
  : never]: K extends `${Prefix}${infer Key}` ?
    Key extends `${infer Parent}.${string}` ?
      InferNativeType<T, `${Prefix}${Parent}.`>
    : InferNativeTypeForField<T[K]>
  : never;
};

/**
 * A type that represents a facet index constraint.
 */
type FacetIndexConstraint =
  | {
      index?: true;
    }
  | {
      index: false;
      facet?: false;
    };

type SortableTypes = "int32" | "float" | "int64";

/**
 * Helper type that checks if a field is sortable.
 * @template T The field schema.
 */
type IsSortable<T extends CollectionField> =
  T["sort"] extends true ? true
  : T["type"] extends SortableTypes ?
    T["sort"] extends false ?
      false
    : true
  : false;

/**
 * Helper type that checks if a field can be used as the default sorting field.
 * @template T The field schema.
 */
type CouldBeDefaultSortingField<T extends CollectionField> =
  T["optional"] extends true ? false
  : IsSortable<T> extends true ? true
  : false;

/**
 * Helper type that checks which fields can be set as a default sorting field.
 * @template T The collection's fields.
 */
type DefaultSortingFields<T extends Record<string, CollectionField>> = {
  [K in keyof T]: CouldBeDefaultSortingField<T[K]> extends true ? K : never;
}[keyof T];

type SortableFields<T extends Record<string, CollectionField>> = {
  [K in keyof T]: IsSortable<T[K]> extends true ? K : never;
}[keyof T] &
  string;

/**
 * Helper type that extracts the keys of fields that have specific boolean field set to `true`.
 */
type IsFieldKeyTrue<T extends CollectionField, K extends keyof T> = T[K] extends true ? K : never;

/**
 * Helper type that extracts the keys of fields that have the `facet` parameter set to `true`.
 * @template T The collection's fields.
 */
type FacetableFieldKeys<T extends Record<string, CollectionField>> = {
  [K in keyof T]: IsFieldKeyTrue<T[K], "facet"> extends never ? never : K;
}[keyof T] &
  string;

/**
 * Helper type that extracts the keys of fields that have the `infix` parameter set to `true`.
 * @template T The collection's fields.
 */
type InfixableFieldKeys<T extends Record<string, CollectionField>> = {
  [K in keyof T]: IsFieldKeyTrue<T[K], "infix"> extends never ? never : K;
}[keyof T] &
  string;

/**
 * Helper type that extracts the keys of fields that are of type `object` or `object[]`.
 * @template T The collection's fields.
 */
type WhichObjectFields<T extends Record<string, CollectionField>> = {
  [K in keyof T]: T[K]["type"] extends "object" | "object[]" ? K : never;
}[keyof T];

/**
 * A type that enforces the `enable_nested_fields` parameter when a collection has nested fields.
 * @template T The collection's fields.
 */
type EnforceNestedFields<T extends Record<string, CollectionField>> =
  WhichObjectFields<T> extends never ? { enable_nested_fields?: boolean }
  : { enable_nested_fields: true };

/**
 * A type that represents a base field schema.
 * @template T The name of the field.
 */
type BaseField<T extends string = string> = FacetIndexConstraint & {
  name: T;
  optional?: boolean;
  facet?: boolean;
  sort?: boolean;
  locale?: string;
  infix?: boolean;
  stem?: boolean;
  num_dim?: number;
  store?: boolean;
  [key: string]: unknown;
};

/**
 * A type that represents a regular field schema.
 * @template T The name of the field.
 */
type RegularField<T extends string = string> = BaseField<T> & {
  type: FieldType;
  embed?: never;
  reference?: never;
};

/**
 * A type that represents a reference field schema. For more information, refer to the
 * [JOINs Documentation](https://typesense.org/docs/27.0/api/joins.html).
 */
type ReferenceField<T extends string = string> = BaseField<T> & {
  name: T;
  type: FieldType;
  embed?: never;
  reference: DotSeparatedString;
};

/**
 * A type that represents an embedding field schema. For more information, refer to the
 * [Vector Search Documentation](https://typesense.org/docs/27.0/api/vector-search.html#nearest-neighbor-vector-search).
 * @template T The name of the field.
 * @template K The name of the fields to embed from.
 */
type EmbeddingField<T extends string = string, K extends string = string> = BaseField<T> & {
  type: "float[]";
  reference?: never;
  embed: {
    from: K[];
    model_config: {
      model_name: string;
      api_key?: string;
      url?: string;
    };
  };
};

/**
 * A type that represents a field schema that should be dropped from a collection.
 * @template T The name of the field.
 */
type DropField<T extends string = string> = {
  name: T;
  drop: true;
};

/**
 * A type that represents a field schema for a collection. For more information, refer to the
 * [Collection Documentation](https://typesense.org/docs/27.0/api/collections.html#schema-parameters).
 * @template T The name of the field.
 * @template K The name of the fields to embed from.
 */
type CollectionField<T extends string = string, K extends string = string> =
  | RegularField<T>
  | EmbeddingField<T, K>
  | ReferenceField<T>;

/**
 * A type that represents a field schema for a collection that should be updated.
 * @template T The name of the field.
 * @template K The name of the fields to embed from.
 */
type CollectionUpdateField<T extends string = string, K extends string = string> =
  | CollectionField<T, K>
  | DropField<T>;

/**
 * Extracts all the field paths from a record of collection schemas.
 * @template T The collection schema record.
 */
type CollectionFieldPathsRecord<T> = {
  [K in keyof T]: T[K] extends (
    {
      name: infer Name;
      fields: infer Fields;
    }
  ) ?
    Name extends string ?
      Fields extends Record<string, { name: string }> ?
        {
          [F in keyof Fields]: Fields[F] extends { name: infer FieldName } ?
            FieldName extends string ?
              `${Name}.${FieldName}`
            : never
          : never;
        }[keyof Fields]
      : never
    : never
  : never;
}[keyof T];

/**
 * Extracts all the field paths from a collection schema.
 * @template T The collection schema.
 */
type CollectionFieldPaths<T> =
  T extends (
    {
      name: infer Name;
      fields: infer Fields;
    }
  ) ?
    Name extends string ?
      Fields extends Record<string, { name: string; type: FieldType }> ?
        {
          [K in keyof Fields]: Fields[K] extends { name: infer FieldName; type: infer Type } ?
            Type extends keyof Omit<FieldTypeToNativeTypeMap, "object" | "object[]"> ?
              FieldName extends string ?
                `${Name}.${FieldName}`
              : never
            : never
          : never;
        }[keyof Fields]
      : never
    : never
  : never;

type DotSeparatedString = `${string}.${string}`;

/**
 * Enforces that the `name` field of each field schema matches the key of the field.
 * @template T The collection schema.
 */
type EnforceKeyAndNameMatch<T extends Record<string, CollectionField<string, keyof T & string>>> = {
  [K in keyof T]: T[K] & { name: K };
};

/**
 * A type that represents a valid collection schema. For more information, refer to the
 * [Collection Documentation](https://typesense.org/docs/27.0/api/collections.html#schema-parameters).
 * @template Fields The fields of the collection.
 * @template Name The name of the collection.
 */
type CollectionCreate<
  Fields extends Record<string, CollectionField<string, keyof Fields & string>>,
  Name extends string,
> = EnforceNestedFields<Fields> & {
  name: Name;
  default_sorting_field?: DefaultSortingFields<Fields> | undefined;
  fields: Fields;
  symbols_to_index?: string[];
  token_separators?: string[];
  metadata?: object;
  voice_query_model?: {
    model_name?: string;
  };
};

type CollCreate<
  Fields extends CollectionField<string, string>[],
  Name extends string,
> = EnforceNestedFieldsTup<Fields> & {
  fields: Fields;
  name: Name;
  default_sorting_field?: DefaultSortingFieldsTup<Fields> | undefined;
};
/**
 * Helper type that checks which fields can be set as a default sorting field.
 * @template T The collection's fields as a tuple.
 */
type DefaultSortingFieldsTup<T extends CollectionField<string, string>[]> = {
  [K in T[number]["name"]]: Extract<T[number], { name: K }> extends infer Field ?
    Field extends CollectionField<string, string> ?
      CouldBeDefaultSortingField<Field> extends true ?
        K
      : never
    : never
  : never;
}[T[number]["name"]];

type EnforceNestedFieldsTup<Fields extends CollectionField<string, string>[]> =
  WhichObjectFieldsTup<Fields> extends never ? { enable_nested_fields?: boolean }
  : { enable_nested_fields: true };

type WhichObjectFieldsTup<Fields extends CollectionField<string, string>[]> = {
  [K in Fields[number]["name"]]: Extract<Fields[number], { name: K }>["type"] extends (
    "object" | "object[]"
  ) ?
    K
  : never;
}[Fields[number]["name"]];

type D = EnforceUniqueFieldNames<typeof test_on.fields>;

type EnforceUniqueFieldNames<T extends CollectionField<string, string>[]> =
  T extends [infer First, ...infer Rest] ?
    First extends CollectionField<string, string> ?
      Rest extends CollectionField<string, string>[] ?
        First["name"] extends Rest[number]["name"] ?
          ["Error: Duplicate field name found", First["name"]]
        : [First, ...EnforceUniqueFieldNames<Rest>]
      : [First]
    : never
  : [];

declare const createCollection: {
  <Fields extends CollectionField<string, string>[], Name extends string>(
    schema: CollCreate<InferTupleNames<Fields>, Name>,
  ): CollCreate<EnforceUniqueFieldNames<InferTupleNames<Fields>>, Name>;
};

type InferNativeTypeTup<T extends CollectionField<string, string>[], Prefix extends string = ""> = {
  [K in T[number]["name"] as K extends `${Prefix}${infer Key}` ?
    Key extends `${infer Parent}.${string}` ?
      Parent
    : Key
  : never]: K extends `${Prefix}${infer Key}` ?
    Key extends `${infer Parent}.${string}` ?
      InferNativeTypeTup<T, `${Prefix}${Parent}.`>
    : InferNativeTypeForField<Extract<T[number], { name: K }>>
  : never;
};

// type CollectionUpdate<
//   Fields extends Record<string, CollectionUpdateField<string, keyof Fields & string>>,
// > = {
//   fields: Fields;
// };

// // Helper type to extract field names
// type FieldNames<T extends Record<string, { name: string }>> = T[keyof T]["name"];

// // Helper types for validation
// type NonDropFieldNames<T extends Record<string, CollectionUpdateField<string, string>>> = {
//   [K in keyof T]: T[K] extends DropField<string> ? never : T[K]["name"];
// }[keyof T];

// type DropFieldNames<T extends Record<string, CollectionUpdateField<string, string>>> = {
//   [K in keyof T]: T[K] extends DropField<string> ? T[K]["name"] : never;
// }[keyof T];

// type ValidateUpdateFields<
//   Create extends { fields: Record<string, CollectionField<string, string>> },
//   Update extends CollectionUpdate<Record<string, CollectionUpdateField<string, string>>>,
// > =
//   DropFieldNames<Update["fields"]> extends FieldNames<Create["fields"]> ?
//     Exclude<NonDropFieldNames<Update["fields"]>, DropFieldNames<Update["fields"]>> extends (
//       Exclude<FieldNames<Update["fields"]>, FieldNames<Create["fields"]>>
//     ) ?
//       Update
//     : "Fields in the update schema already exist in the original schema."
//   : "Dropped fields in the update schema don't exist in the original schema.";

// // Improved merge type
// type MergeCollectionSchemas<
//   Create extends { fields: Record<string, CollectionField<string, string>> },
//   Update extends CollectionUpdate<Record<string, CollectionUpdateField<string, string>>>,
// > =
//   ValidateUpdateFields<Create, Update> extends Update ?
//     Omit<Create, "fields"> & {
//       fields: {
//         [K in FieldNames<Create["fields"]> | FieldNames<Update["fields"]>]: K extends (
//           FieldNames<Update["fields"]>
//         ) ?
//           Update["fields"][keyof Update["fields"] &
//             {
//               [P in keyof Update["fields"]]: Update["fields"][P]["name"] extends K ? P : never;
//             }[keyof Update["fields"]]] extends DropField ?
//             never
//           : Exclude<
//               Update["fields"][keyof Update["fields"] &
//                 {
//                   [P in keyof Update["fields"]]: Update["fields"][P]["name"] extends K ? P : never;
//                 }[keyof Update["fields"]]],
//               DropField
//             >
//         : K extends FieldNames<Create["fields"]> ?
//           Create["fields"][keyof Create["fields"] &
//             {
//               [P in keyof Create["fields"]]: Create["fields"][P]["name"] extends K ? P : never;
//             }[keyof Create["fields"]]]
//         : never;
//       };
//     }
//   : never;

type CollectionUpdate<Fields extends CollectionUpdateField<string, string>[]> = {
  fields: Fields;
};

type TupleToUnion<T extends unknown[]> = T[number];

type NonDropFieldNames<T extends CollectionUpdateField<string, string>[]> =
  T[number] extends infer F ?
    F extends { drop: true } ? never
    : F extends { name: infer N } ? N
    : never
  : never;

type DropFieldNames<T extends CollectionUpdateField<string, string>[]> =
  T[number] extends infer F ?
    F extends DropField<string> ?
      F["name"]
    : never
  : never;

type FieldNames<T extends { name: string }[]> = T[number]["name"];

type DropFields<
  Original extends CollectionField<string, string>[],
  Update extends CollectionUpdateField<string, string>[],
> =
  Original extends [infer Head, ...infer Tail extends CollectionField<string, string>[]] ?
    Head extends { name: infer Name } ?
      Name extends FitlerOutNonDropFields<Update>[number]["name"] ?
        DropFields<Tail, Update>
      : [Head, ...DropFields<Tail, Update>]
    : never
  : [];

type FitlerOutDropFields<T extends CollectionUpdateField<string, string>[]> =
  T extends [infer Head, ...infer Tail extends CollectionUpdateField<string, string>[]] ?
    Head extends DropField<string> ?
      FitlerOutDropFields<Tail>
    : [Head, ...FitlerOutDropFields<Tail>]
  : [];
type FitlerOutNonDropFields<T extends CollectionUpdateField<string, string>[]> =
  T extends [infer Head, ...infer Tail extends CollectionUpdateField<string, string>[]] ?
    Head extends DropField<string> ?
      [Head, ...FitlerOutDropFields<Tail>]
    : FitlerOutDropFields<Tail>
  : [];

type As = FitlerOutDropFields<[{ drop: true; name: "title" }]>;

type Bs = FitlerOutNonDropFields<
  [{ drop: true; name: "title" }, { name: "title"; type: "string" }]
>;
type UpdateTuple<
  Create extends CollectionField<string, string>[],
  Update extends CollectionUpdateField<string, string>[],
> = [...DropFields<Create, Update>, ...FitlerOutDropFields<Update>];

// Updated MergeCollectionSchemas
type MergeCollectionSchemas<
  Create extends CollCreate<CollectionField<string, string>[], string>,
  Update extends CollectionUpdate<CollectionUpdateField<string, string>[]>,
> =
  ValidateUpdateFields<Create, Update> extends Update ?
    Omit<Create, "fields"> & {
      fields: UpdateTuple<Create["fields"], Update["fields"]>;
    }
  : never;

// Helper to enforce name matching in updates
type EnforceUpdateKeyAndNameMatch<T extends CollectionUpdateField<string, string>[]> = {
  [K in keyof T]: T[K] & { name: Lowercase<T[K]["name"] & string> };
};

type InferTupleNames<T extends CollectionField<string, string>[]> = {
  [K in keyof T]: T[K] & { name: Lowercase<T[K]["name"] & string> };
};
declare const updateCollection: {
  <
    Create extends { fields: CollectionField<string, string>[]; name: string },
    Update extends CollectionUpdate<CollectionUpdateField<string, string>[]>,
  >(
    _create: Create,
    _update: Update,
  ): MergeCollectionSchemas<Create, Update>;
};

type X = UpdateTuple<
  typeof test_on.fields,
  [{ drop: true; name: "title" }, { name: "title"; type: "int32" }]
>;
declare const updateParams: {
  <T extends CollectionUpdateField<string, string>[]>(update: {
    fields: EnforceUpdateKeyAndNameMatch<T>;
  }): ValidateUpdate<{ fields: EnforceUpdateKeyAndNameMatch<T> }>;
};

const test = updateCollection(
  //    ^?
  test_on,
  updateParams({
    fields: [
      { name: "lucky", type: "string" },
      { name: "obj", drop: true },
      { name: "obj.name", type: "string" },
      {
        name: "title",
        drop: true,
      },
      {
        name: "title",
        type: "int32",
      },
    ],
  }),
);

type Up = ValidateUpdate<typeof up>;
const up =
  //    ^?
  updateParams({
    fields: [
      { name: "lucky", type: "string" },
      { name: "obj", drop: true },
      { name: "obj.name", drop: true },
      {
        name: "title",
        drop: true,
      },
      {
        name: "title",
        type: "int32",
      },
    ],
  });

const test2 = updateCollection(
  test,
  updateParams({
    fields: [{ name: "age", drop: true }],
  }),
);

export type A = InferNativeTypeTup<typeof test.fields>;
//          ^?

export type B = InferNativeTypeTup<typeof test2.fields>;
//          ^?

const schema = defineCollection({
  name: "books",
  fields: {
    title: { type: "string", facet: true, name: "title" },
    age: { type: "int32", sort: true, name: "age" },
  },
});

// type EnforceUpdateKeyAndNameMatch<T extends Record<string, CollectionUpdateField<string, string>>> =
//   {
//     [K in keyof T]: T[K] & { name: Lowercase<RemoveFromString<K & string, "drop">> };
//   };
// declare const defineUpdate: {
//   <T extends Record<string, CollectionUpdateField<string, string>>>(update: {
//     fields: EnforceUpdateKeyAndNameMatch<T>;
//   }): { fields: EnforceUpdateKeyAndNameMatch<T> };
// };

// type RemoveFromString<T extends string, K extends string> =
//   T extends `${infer L}${K}${infer R}` ? `${L}${R}` : T;

// const test = updateCollection(
//   //    ^?
//   original,
//   defineUpdate({
//     fields: {
//       dropTitle: { drop: true, name: "title" },
//     },
//   }),
// );

// const test3 = updateCollection(
//   test,
//   defineUpdate({
//     fields: {
//       dropTitle: { type: "int32", name: "title" },
//     },
//   }),
// );

//   ^?

/**
 * A helper function used for creating a collection schema.
 * @template T The collection's fields.
 * @template Name The name of the collection.
 */
function defineCollection<
  T extends Record<string, CollectionField<string, keyof T & string>>,
  Name extends string,
>(
  schema: CollectionCreate<EnforceKeyAndNameMatch<T>, Name>,
): CollectionCreate<EnforceKeyAndNameMatch<T>, Name> {
  return schema;
}

/**
 * A type that checks if a field is referenced by another field in a foreign collection.
 * @template CurrentCollection The name of the current collection.
 * @template CurrentField The name of the current field.
 */
type IsFieldReferenced<CurrentCollection extends string, CurrentField extends string> = {
  [CollectionName in keyof GlobalCollections]: {
    [FieldName in keyof GlobalCollections[CollectionName]["fields"]]: GlobalCollections[CollectionName]["fields"][FieldName] extends (
      {
        reference: `${CurrentCollection}.${CurrentField}`;
      }
    ) ?
      CollectionName
    : never;
  }[keyof GlobalCollections[CollectionName]["fields"]];
}[keyof GlobalCollections];

/**
 * A type that checks if a collection has fields that are referenced by another collection.
 * @template CollectionName The name of the current collection.
 * @template CollectionSchema The schema of the current collection.
 */
type HasReferencedFields<
  CollectionName extends string,
  CollectionSchema extends Record<string, CollectionField>,
> =
  {
    [FieldName in keyof CollectionSchema]: IsFieldReferenced<
      CollectionName,
      CollectionSchema[FieldName]["name"]
    >;
  }[keyof CollectionSchema] extends false ?
    never
  : IsFieldReferenced<CollectionName, CollectionSchema[keyof CollectionSchema]["name"]>;

/**
 * A type that returns all the collections that have fields that are referenced by another collection.
 */
type CheckReferences = {
  [CollectionName in keyof GlobalCollections]: HasReferencedFields<
    CollectionName & string,
    GlobalCollections[CollectionName]["fields"]
  >;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GlobalCollections {}

export type {
  Base64,
  CheckReferences,
  CollectionCreate as CollectionCreateSchema,
  CollectionField as CollectionFieldSchema,
  DocumentSchema,
  EnforceKeyAndNameMatch,
  FacetableFieldKeys,
  FieldType,
  GlobalCollections,
  InferNativeType,
  InfixableFieldKeys,
  SortableFields,
};

export { defineCollection };

type ValidateUpdateFields<
  Create extends { fields: CollectionField<string, string>[] },
  Update extends CollectionUpdate<CollectionUpdateField<string, string>[]>,
> =
  DropFieldNames<Update["fields"]> extends Create["fields"][number]["name"] ?
    Exclude<NonDropFieldNames<Update["fields"]>, DropFieldNames<Update["fields"]>> extends (
      Exclude<FieldNames<Update["fields"]>, Create["fields"][number]["name"]>
    ) ?
      ValidateUpdate<Update>
    : "Fields in the update schema already exist in the original schema."
  : "Dropped fields in the update schema don't exist in the original schema.";

type ValidateUpdate<Update extends CollectionUpdate<CollectionUpdateField<string, string>[]>> =
  ExtractParents<Update["fields"]> extends infer Parents ?
    Parents extends Record<string, { dropped: boolean; reinstantiated: unknown }> ?
      ValidateFields<Update["fields"], Parents> extends true ?
        Update
      : ValidateFields<Update["fields"], Parents>
    : never
  : never;

type ValidateFields<
  Fields extends CollectionUpdateField<string, string>[],
  Parents extends Record<string, { dropped: boolean; reinstantiated: unknown }>,
> =
  Fields extends [infer First, ...infer Rest] ?
    First extends CollectionUpdateField<string, string> ?
      ValidateField<First, Parents> extends true ?
        ValidateFields<Rest extends CollectionUpdateField<string, string>[] ? Rest : [], Parents>
      : ValidateField<First, Parents>
    : true
  : true;

type ValidateField<
  Field extends CollectionUpdateField<string, string>,
  Parents extends Record<string, { dropped: boolean; reinstantiated: unknown }>,
> =
  Field extends { name: string } ?
    // Get the parent name or the field name if it's not nested
    GetParent<Field["name"]> extends infer ParentName ?
      ParentName extends keyof Parents ?
        Parents[ParentName]["dropped"] extends true ?
          Parents[ParentName]["reinstantiated"] extends "object" ?
            true
          : `Field ${Field["name"]} is nested under a field that was dropped.`
        : Parents[ParentName]["reinstantiated"] extends "object" ?
          `Field ${Field["name"]} is nested under a field that was updated without being dropped.`
        : true
      : true
    : never
  : never;

type ExtractParents<Fields extends CollectionUpdateField<string, string>[]> = {
  [K in Fields[number]["name"] as K extends GetParent<Fields[number]["name"]> ? K : never]: {
    dropped: Extract<Fields[number], { name: K; drop: true }> extends never ? false : true;
    reinstantiated: Extract<Fields[number], { name: K; type: string }> extends { type: infer T } ? T
    : false;
  };
};
type S = ValidateUpdate<{
  fields: [
    { name: "lucky"; type: "string" },
    {
      name: "title";
      drop: true;
    },
    {
      name: "title";
      type: "int32";
    },
  ];
}>;
type Par = ExtractParents<
  [
    { name: "lucky"; type: "string" },
    {
      name: "title";
      drop: true;
    },
    {
      name: "title";
      type: "int32";
    },
  ]
>;
type GetParent<T extends string> = T extends `${infer Parent}.${string}` ? Parent : never;

type ValidateUpdateFieldsOrg<
  Create extends { fields: Record<string, CollectionField<string, string>> },
  Update extends CollectionUpdate<CollectionUpdateField<string, string>[]>,
> =
  DropFieldNames<Update["fields"]> extends keyof Create["fields"] ?
    Exclude<NonDropFieldNames<Update["fields"]>, DropFieldNames<Update["fields"]>> extends (
      Exclude<FieldNames<Update["fields"]>, keyof Create["fields"]>
    ) ?
      Update
    : "Fields in the update schema already exist in the original schema."
  : "Dropped fields in the update schema don't exist in the original schema.";

// type MergeCollectionSchemas<
//   Create extends CollectionCreate<Record<string, CollectionField<string, string>>, string>,
//   Update extends CollectionUpdate<CollectionUpdateField<string, string>[]>,
// > =
//   ValidateUpdateFields<Create, Update> extends Update ?
//     Omit<Create, "fields"> & {
//       fields: {
//         [K in Exclude<
//           keyof Create["fields"] | NonDropFieldNames<Update["fields"]>,
//           DropFieldNames<Update["fields"]>
//         >]: K extends NonDropFieldNames<Update["fields"]> ?
//           Omit<Extract<Update["fields"][number], { name: K }>, "drop"> extends infer F ?
//             F extends { type: string } ? F
//             : K extends keyof Create["fields"] ? Create["fields"][K]
//             : F
//           : never
//         : K extends keyof Create["fields"] ? Create["fields"][K]
//         : never;
//       };
//     }
//   : never;

const collection = createCollection({
  name: "books",
  fields: [
    { name: "title", type: "string", sort: false },
    { name: "isbn", type: "int32" },
  ],
  default_sorting_field: "isbn",
  enable_nested_fields: true,
});

type Collection = InferNativeTypeTup<typeof collection.fields>;
// type Collection = {
//     title: string;
//     isbn: number;
// }
const updatedCollection = updateCollection(
  collection,
  updateParams({
    fields: [
      { name: "title", drop: true },
      { name: "title", type: "int32" },
      { name: "new_type", type: "string" },
    ],
  }),
);

type UpdatedCollection = InferNativeTypeTup<typeof updatedCollection.fields>;
// type UpdatedCollection = {
//     title: number;
//     isbn: number;
//     new_type: stirng;
// }

interface Primitive<Role extends string> {
  role: Role;
}

interface User extends Primitive<"user"> {
  name: string;
}

interface Admin extends Primitive<"admin"> {
  permissions: string[];
}

const dyanmicObject = {
  role: "admin" as const,
  permissions: ["read", "write"],
};

type InferUserOrAdmin<T extends { role: string }> =
  T["role"] extends Admin["role"] ? Admin
  : T["role"] extends User["role"] ? User
  : never;

const adminObj: InferUserOrAdmin<typeof dyanmicObject> = dyanmicObject;
