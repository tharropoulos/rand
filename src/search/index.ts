import {
  CollectionFieldSchema,
  defineCollectionSchema,
  FacetableFieldKeys,
  InfixableFieldKeys,
} from "../collection";
import { Parse as FilterParser } from "../filter-parser";

type OperationMode = "off" | "always" | "fallback";

type Remove<
  T,
  ToRemove extends string,
  Collect extends string = "",
> = T extends `${infer Head}${infer Remaining}`
  ? Remove<Remaining, ToRemove, `${Collect}${Head extends ToRemove ? "" : Head}`>
  : Collect;

type SplitByComma<T extends string> = T extends `${infer Head},${infer Tail}`
  ? [Head, ...SplitByComma<Tail>]
  : [T];

type Combinations<T extends string, U extends string = T> = T extends any
  ? T | `${T},${Combinations<Exclude<U, T>>}`
  : never;

type FormatCombinations<T extends string> = {
  [K in Combinations<T> as K extends string ? K : never]: K;
};

type FacetBy<T extends Record<string, CollectionFieldSchema>> = FormatCombinations<
  FacetableFieldKeys<T>
>;

type InfixBy<T extends Record<string, CollectionFieldSchema>> = FormatCombinations<
  InfixableFieldKeys<T>
>;

type InfixValue<
  T extends Record<string, CollectionFieldSchema>,
  K extends keyof T,
> = K extends InfixableFieldKeys<T> ? OperationMode : "off";

type MapInfixValues<
  T extends Record<string, CollectionFieldSchema>,
  K extends readonly unknown[],
> = K extends (keyof T)[]
  ? {
      [P in keyof K]: InfixValue<T, K[P]>;
    }
  : never;

type QueryBy<T extends Record<string, CollectionFieldSchema>> = FormatCombinations<
  keyof T extends string ? keyof T : never
>;

export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

type LengthOf<T extends readonly unknown[]> = T["length"];

type TupleOfLength<
  Length extends number,
  Type = unknown,
  Arr extends Type[] = [],
> = Arr["length"] extends Length ? Arr : TupleOfLength<Length, Type, [...Arr, Type]>;

type ExtractFacetFields<S extends string> = S extends `${infer T},${infer U}`
  ? T | ExtractFacetFields<U>
  : S;

type ValidFacetQuery<
  T extends Record<string, CollectionFieldSchema>,
  F extends keyof FacetBy<T> | undefined,
> = F extends string ? `${ExtractFacetFields<F>}:${string}` : never;

type PinnedHitPair = `${number}:${number}`;

type CommaSeparatedPinnedHits<T extends string> = T extends PinnedHitPair
  ? T
  : T extends `${infer Head},${infer Tail}`
  ? Head extends PinnedHitPair
    ? T extends `${Head},${CommaSeparatedPinnedHits<Tail>}`
      ? T
      : never
    : never
  : never;

type PinnedHitsParser<T extends string> = T extends CommaSeparatedPinnedHits<T>
  ? true
  : `Invalid pinned_hits format: ${T}`;

type QueryParams<
  TFields extends Record<string, CollectionFieldSchema>,
  S extends keyof QueryBy<TFields> = keyof QueryBy<TFields>,
  SplitS extends readonly unknown[] = SplitByComma<S>,
  L extends number = LengthOf<SplitS>,
> = {
  q: string;
  query_by: S;
  prefix?: TupleOfLength<L, boolean> | boolean;
  infix?: MapInfixValues<TFields, SplitS>;
  pre_segmented_query?: boolean;
  // vector_query: TODO
  voice_query?: string;
};

type RankingParams<
  TFields extends Record<string, CollectionFieldSchema>,
  S extends keyof QueryBy<TFields> = keyof QueryBy<TFields>,
  SplitS extends readonly unknown[] = SplitByComma<S>,
  L extends number = LengthOf<SplitS>,
> = {
  query_by_weights: TupleOfLength<L, number>;
  prioritize_token_position?: boolean;
  prioritize_num_matching_fields?: boolean;
  prioritize_exact_match?: boolean;
  text_match_type?: "max_score" | "max_weight";
  enable_overrides?: boolean;
  // override_tags: TODO
  // sort_by: TODO
  max_candidates?: number;
};

type PaginationParams = {
  page?: number;
  per_page?: number;
  offset?: number;
  limit?: number;
};

export type SearchParams<
  TFields extends Record<string, CollectionFieldSchema>,
  TFilterBy extends string,
  S extends keyof QueryBy<TFields> = keyof QueryBy<TFields>,
  SplitS extends readonly unknown[] = SplitByComma<S>,
  L extends number = LengthOf<SplitS>,
> = Equal<FilterParser<TFilterBy, TFields>, true> extends true
  ? {
      q: string;
      query_by: S;
      query_by_weights: TupleOfLength<L, number>;
      prefix?: TupleOfLength<L, boolean> | boolean;
      facet_by?: keyof FacetBy<TFields>;
      enable_lazy_filet?: boolean;
      group_by?: keyof FacetBy<TFields>;
      group_limit?: number;
      group_missing_values?: boolean;
      infix?: MapInfixValues<TFields, SplitS>;
      filter_by?: TFilterBy;
      max_facet_values?: number;
      facet_sample_percent?: number;
      facet_sample_threshold?: number;
      text_match_type?: "max_score" | "max_weight";
      prioritize_token_position?: boolean;
      prioritize_num_matching_fields?: boolean;
      prioritize_exact_match?: boolean;
      pre_segmented_query?: boolean;
      voice_query?: string;
    } & FacetParams<TFields>
  : FilterParser<TFilterBy, TFields> extends string
  ? `[Error on filter_by]: ${FilterParser<TFilterBy, TFields>}`
  : "Unknown error";

type FacetParams<TFields extends Record<string, CollectionFieldSchema>> =
  | {
      facet_by: keyof FacetBy<TFields>;
      facet_query?: ValidFacetQuery<TFields, keyof FacetBy<TFields>>;
      facet_query_num_typos?: number;
    }
  | { facet_by?: undefined; facet_query?: undefined };

export function createSearchParams<
  TFields extends Record<string, CollectionFieldSchema>,
  TFilterBy extends string,
  S extends keyof QueryBy<TFields>,
  SplitS extends readonly any[] = SplitByComma<S>,
  L extends number = LengthOf<SplitS>,
  PinnedHits extends string = string,
>(
  fields: TFields,
  params: SearchParams<TFields, TFilterBy, S, SplitS, L>,
): SearchParams<TFields, TFilterBy, S, SplitS, L> {
  return params;
}

const usersSchema = defineCollectionSchema({
  name: "users",
  fields: {
    id: { type: "string", optional: false, name: "id" },
    name: { type: "string", optional: false, name: "name", facet: true },
    age: { type: "int32", optional: false, sort: true, name: "age", facet: true, infix: true },
    email: { type: "string", optional: true, name: "email" },
  },
});

const test = createSearchParams(usersSchema.fields, {
  query_by: "age,id,email",
  query_by_weights: [2, 3, 5],
  q: "test",
  filter_by: "age:>10",
  infix: ["fallback", "off", "off"],
  facet_by: "age,name",
  facet_query: "name:john",
});

// New type to ensure preset names match in the consumer code
export type EnsureCorrectPresetNames<T, AllowedNames extends string> = {
  [K in keyof T]: K extends AllowedNames ? T[K] : never;
};

// Helper type to extract preset names from an object of NamedPresets
export type PresetNames<T> = {
  [K in keyof T]: T[K] extends NamedPreset<infer Name, any> ? Name : never;
}[keyof T];

// Helper type to create the PresetRegistry from an object of NamedPresets
export type CreatePresetRegistry<T> = EnsureCorrectPresetNames<
  {
    [K in keyof T]: T[K] extends NamedPreset<any, infer Preset> ? Preset : never;
  },
  PresetNames<T>
>;

// Export a function to create a type-safe preset registry
export function createPresetRegistry<T extends Record<string, NamedPreset<string, any>>>(
  presets: T,
): CreatePresetRegistry<T> {
  return Object.fromEntries(
    Object.values(presets).map((preset) => [preset.name, preset.preset]),
  ) as CreatePresetRegistry<T>;
}
export type SearchParamsWithPreset<
  TFields extends Record<string, CollectionFieldSchema>,
  TFilterBy extends string,
  S extends keyof QueryBy<TFields> = keyof QueryBy<TFields>,
  SplitS extends readonly unknown[] = SplitByComma<S>,
  L extends number = LengthOf<SplitS>,
> = SearchParams<TFields, TFilterBy, S, SplitS, L> & {
  preset?: GlobalPresetNames;
};

export function createSearchParamsWithPreset<
  TFields extends Record<string, CollectionFieldSchema>,
  TFilterBy extends string,
  S extends keyof QueryBy<TFields>,
  SplitS extends readonly any[] = SplitByComma<S>,
  L extends number = LengthOf<SplitS>,
  PinnedHits extends string = string,
>(
  fields: TFields,
  params: SearchParamsWithPreset<TFields, TFilterBy, S, SplitS, L>,
): SearchParamsWithPreset<TFields, TFilterBy, S, SplitS, L> {
  return params;
}

export function definePreset<
  Name extends string,
  TFields extends Record<string, CollectionFieldSchema>,
  TFilterBy extends string,
  S extends keyof QueryBy<TFields> = keyof QueryBy<TFields>,
  SplitS extends readonly unknown[] = SplitByComma<S>,
  L extends number = LengthOf<SplitS>,
  PinnedHits extends string = string,
>(
  fields: TFields,
  name: Name,
  params: SearchParams<TFields, TFilterBy, S, SplitS, L>,
): NamedPreset<Name, typeof params> {
  return { name, preset: params };
}

const defaultPreset = definePreset(usersSchema.fields, "default", {
  q: "test",
  query_by: "age,id,email",
  query_by_weights: [2, 3, 5],
  filter_by: "age:>10",
  infix: ["fallback", "off", "off"],
  facet_by: "name,age",
  facet_query: "age:john",
});

const anotherPreset = definePreset(usersSchema.fields, "antoehr", {
  q: "test",
  query_by: "age,id,email",
  query_by_weights: [2, 3, 5],
  filter_by: "age:>10",
  infix: ["fallback", "off", "off"],
  facet_by: "name",
  facet_query: "age:john",
});

export type NamedPreset<Name extends string, Preset> = {
  name: Name;
  preset: Preset;
};

export type PresetRegistryMap<T extends NamedPreset<string, any>> = {
  [K in T["name"]]: T["preset"];
};
// Use a tuple to preserve all presets
export type PresetTuple = readonly NamedPreset<string, any>[];

type UniqueNames<T extends PresetTuple, Acc extends PresetTuple = []> = T extends readonly [
  infer First,
  ...infer Rest extends PresetTuple,
]
  ? First extends NamedPreset<infer Name, any>
    ? Name extends Acc[number]["name"]
      ? ["Error: Duplicate preset name", Name]
      : UniqueNames<Rest, [...Acc, First]>
    : never
  : Acc;
// Utility type to create a map from the tuple
type UserPresets = [typeof defaultPreset, typeof anotherPreset];

type TupleToMap<T extends PresetTuple> = {
  [K in T[number]["name"]]: Extract<T[number], { name: K }>["preset"];
};

type RegisterPresets<T extends PresetTuple> = TupleToMap<T>;
// Empty interface for declaration merging
export interface PresetRegistry {}

export type GlobalPresetNames = keyof PresetRegistry;

declare module "." {
  interface PresetRegistry extends RegisterPresets<[typeof defaultPreset, typeof anotherPreset]> {}
}

const validSearch = createSearchParamsWithPreset(usersSchema.fields, {
  q: "test",
  preset: "antoehr",
  query_by: "age,id,email",
  query_by_weights: [1, 3, 5],
});
