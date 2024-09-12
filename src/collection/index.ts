import { Parse as FilterParser } from "../filter-parser";
declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };

type Branded<T, B> = T & Brand<B>;

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

type DocumentSchema = {
  [K in string]: FieldType | DocumentSchema;
};

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

type InferNativeType<
  T extends Record<string, CollectionFieldSchema>,
  Prefix extends string = "",
> = {
  [K in keyof T as K extends `${Prefix}${infer Key}`
    ? Key extends `${infer Parent}.${string}`
      ? Parent
      : Key
    : never]: K extends `${Prefix}${infer Key}`
    ? Key extends `${infer Parent}.${string}`
      ? InferNativeType<T, `${Prefix}${Parent}.`>
      : T[K]["type"] extends keyof FieldTypeToNativeTypeMap
      ? T[K]["optional"] extends true
        ? FieldTypeToNativeTypeMap[T[K]["type"]] | undefined
        : FieldTypeToNativeTypeMap[T[K]["type"]]
      : never
    : never;
};

interface BaseCollectionFieldSchema<T extends string = string> {
  name: T;
  type: FieldType;
  optional?: boolean;
  facet?: boolean;
  sort?: boolean;
  locale?: string;
  infix?: boolean;
  stem?: boolean;
  num_dim?: number;
  store?: boolean;
  [key: string]: unknown;
}

type SortIndexConstraint =
  | {
      index?: true;
    }
  | {
      index: false;
      sort?: false;
    };

type FacetIndexConstraint =
  | {
      index?: true;
    }
  | {
      index: false;
      facet?: false;
    };

type CollectionFieldSchema<T extends string = string> = BaseCollectionFieldSchema<T> &
  FacetIndexConstraint &
  SortIndexConstraint;

type SortableFields = "int32" | "float" | "int64";

type IsSortable<T extends CollectionFieldSchema> = T["sort"] extends true
  ? true
  : T["type"] extends SortableFields
  ? T["sort"] extends false
    ? false
    : true
  : false;

type DefaultSortingField<T extends CollectionFieldSchema> = T["optional"] extends true
  ? false
  : IsSortable<T> extends true
  ? true
  : false;

type SortableFieldKeys<T extends Record<string, CollectionFieldSchema>> = {
  [K in keyof T]: DefaultSortingField<T[K]> extends true ? K : never;
}[keyof T];

type IsFieldKeyTrue<
  T extends CollectionFieldSchema,
  K extends keyof CollectionFieldSchema,
> = T[K] extends true ? K : never;

type FacetableFieldKeys<T extends Record<string, CollectionFieldSchema>> = {
  [K in keyof T]: IsFieldKeyTrue<T[K], "facet"> extends never ? never : K;
}[keyof T] &
  string;

type InfixableFieldKeys<T extends Record<string, CollectionFieldSchema>> = {
  [K in keyof T]: IsFieldKeyTrue<T[K], "infix"> extends never ? never : K;
}[keyof T] &
  string;

type HasObjectField<T extends Record<string, CollectionFieldSchema>> = {
  [K in keyof T]: T[K]["type"] extends "object" | "object[]" ? K : never;
}[keyof T];

type EnableNestedFields<T extends Record<string, CollectionFieldSchema>> =
  HasObjectField<T> extends never
    ? { enable_nested_fields?: boolean }
    : { enable_nested_fields: true };

type EnforceKeyAndNameMatch<T extends Record<string, CollectionFieldSchema>> = {
  [K in keyof T]: T[K] & { name: K };
};

type CollectionCreateSchema<Fields extends Record<string, CollectionFieldSchema>> = {
  name: string;
  default_sorting_field?: SortableFieldKeys<Fields>;
  fields: Fields;
  symbols_to_index?: string[];
  token_separators?: string[];
  metadata?: object;
  voice_query_model?: {
    model_name?: string;
  };
} & EnableNestedFields<Fields>;

function defineCollectionSchema<T extends Record<string, CollectionFieldSchema>>(
  schema: CollectionCreateSchema<EnforceKeyAndNameMatch<T>>,
): CollectionCreateSchema<EnforceKeyAndNameMatch<T>> {
  return schema;
}

export type {
  CollectionFieldSchema,
  InferNativeType,
  CollectionCreateSchema,
  FieldType,
  FacetableFieldKeys,
  InfixableFieldKeys,
  EnforceKeyAndNameMatch,
  Base64,
  DocumentSchema,
};

export { defineCollectionSchema };
