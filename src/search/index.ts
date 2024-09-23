import type {
  CollectionCreateSchema,
  CollectionFieldSchema,
  defineCollection,
  FacetableFieldKeys,
  InfixableFieldKeys,
} from "../collection";

import type { Parse as FilterParser } from "../lexer/filter";
import type { OmitDefaultSortingField, Parse as SortParser } from "../lexer/sort";

type OperationMode = "off" | "always" | "fallback";
type DropTokensMode = "right_to_left" | "left_to_right" | "both_sides:3";

export type Remove<T, ToRemove extends string, Collect extends string = ""> =
  T extends `${infer Head}${infer Remaining}` ?
    Remove<Remaining, ToRemove, `${Collect}${Head extends ToRemove ? "" : Head}`>
  : Collect;

type SplitByComma<T extends string> =
  T extends `${infer Head},${infer Tail}` ? [Head, ...SplitByComma<Tail>] : [T];

type Combinations<T extends string, U extends string = T> =
  T extends unknown ? T | `${T},${Combinations<Exclude<U, T>>}` : never;

type FormatCombinations<T extends string> = {
  [K in Combinations<T> as K extends string ? K : never]: K;
};

type FacetBy<T extends Record<string, CollectionFieldSchema>> = FormatCombinations<
  FacetableFieldKeys<T>
>;

type InfixBy<T extends Record<string, CollectionFieldSchema>> = FormatCombinations<
  InfixableFieldKeys<T>
>;

type InfixValue<T extends Record<string, CollectionFieldSchema>, K extends keyof T> =
  K extends InfixableFieldKeys<T> ? OperationMode : "off";

type MapInfixValues<T extends Record<string, CollectionFieldSchema>, K extends readonly unknown[]> =
  K extends (keyof T)[] ?
    {
      [P in keyof K]: InfixValue<T, K[P]>;
    }
  : never;

type QueryBy<T extends Record<string, CollectionFieldSchema>> = FormatCombinations<
  keyof T extends string ? keyof T : never
>;

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

type LengthOf<T extends readonly unknown[]> = T["length"];

type TupleOfLength<Length extends number, Type = unknown, Arr extends Type[] = []> =
  Arr["length"] extends Length ? Arr : TupleOfLength<Length, Type, [...Arr, Type]>;

type ExtractFacetFields<S extends string> =
  S extends `${infer T},${infer U}` ? T | ExtractFacetFields<U> : S;

type ValidFacetQuery<
  T extends Record<string, CollectionFieldSchema>,
  F extends keyof FacetBy<T> | undefined,
> = F extends string ? `${ExtractFacetFields<F>}:${string}` : never;

type PinnedHitPair = `${number}:${number}`;

type CommaSeparatedPinnedHits<T extends string> =
  T extends PinnedHitPair ? T
  : T extends `${infer Head},${infer Tail}` ?
    Head extends PinnedHitPair ?
      T extends `${Head},${CommaSeparatedPinnedHits<Tail>}` ?
        T
      : never
    : never
  : never;

type PinnedHitsParser<T extends string> =
  T extends CommaSeparatedPinnedHits<T> ? true : `Invalid pinned_hits format: ${T}`;

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

/**
 * Creates a union type representing a range of numbers from Start to End (inclusive).
 * @template Start The start of the range.
 * @template End The end of the range.
 * @template Arr Helper parameter for recursion, do not specify this manually.
 * @template Acc Helper parameter for recursion, do not specify this manually.
 */
type NumberRange<
  Start extends number,
  End extends number,
  Arr extends unknown[] = [],
  Acc = never,
> =
  Arr["length"] extends End ? Acc | End
  : NumberRange<
      Start,
      End,
      [...Arr, 1],
      Arr["length"] extends Start ? Arr["length"] : Acc | Arr["length"]
    >;

type TypoToleranceParams<
  TFields extends Record<string, CollectionFieldSchema>,
  S extends keyof QueryBy<TFields> = keyof QueryBy<TFields>,
  SplitS extends readonly unknown[] = SplitByComma<S>,
  L extends number = LengthOf<SplitS>,
> = {
  num_typos?: TupleOfLength<L, NumberRange<0, 2>> | NumberRange<0, 2>;
  min_len_1typo?: number;
  min_len_2typo?: number;
  split_join_tokens?: OperationMode;
  typo_tokens_threshold?: number;
  drop_tokens_threshold?: number;
  drop_tokens_mode?: DropTokensMode;
  enable_typos_for_numerical_tokens?: boolean;
  enable_typos_for_alpha_numerical_tokens?: boolean;
  synonym_num_typos?: boolean;
};

export type SearchParams<
  TCollection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema<string, string>>, string>
  >,
  FilterBy extends string,
  SortBy extends string,
  S extends keyof QueryBy<TCollection["fields"]> = keyof QueryBy<TCollection["fields"]>,
  SplitS extends readonly string[] = SplitByComma<S>,
  L extends number = LengthOf<SplitS>,
> =
  Equal<SortParser<SortBy, TCollection>, true> extends true ?
    Equal<FilterParser<FilterBy, TCollection>, true> extends true ?
      FacetParams<TCollection["fields"]> & {
        q: string;
        query_by: S;
        query_by_weights: TupleOfLength<L, number>;
        prefix?: TupleOfLength<L, boolean> | boolean;
        facet_by?: keyof FacetBy<TCollection["fields"]>;
        enable_lazy_filet?: boolean;
        group_by?: keyof FacetBy<TCollection["fields"]>;
        group_limit?: number;
        group_missing_values?: boolean;
        infix?: MapInfixValues<TCollection["fields"], SplitS>;
        filter_by?: FilterBy;
        sort_by?: SortBy;
        max_facet_values?: number;
        facet_sample_percent?: number;
        facet_sample_threshold?: number;
        text_match_type?: "max_score" | "max_weight";
        prioritize_token_position?: boolean;
        prioritize_num_matching_fields?: boolean;
        prioritize_exact_match?: boolean;
        pre_segmented_query?: boolean;
        voice_query?: string;
      }
    : FilterParser<FilterBy, TCollection> extends string ?
      `[Error on filter_by]: ${FilterParser<FilterBy, TCollection>}`
    : "Unknown error"
  : `[Error on sort_by]: ${SortParser<SortBy, TCollection> & string}`;

type FacetParams<TFields extends Record<string, CollectionFieldSchema>> =
  | {
      facet_by: keyof FacetBy<TFields>;
      facet_query?: ValidFacetQuery<TFields, keyof FacetBy<TFields>>;
      facet_query_num_typos?: number;
    }
  | { facet_by?: undefined; facet_query?: undefined };

export function createSearchParams<
  Collection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema<string, string>>, string>
  >,
  FilterBy extends string,
  SortBy extends string,
  SelectedField extends keyof QueryBy<Collection["fields"]>,
  CommaSeparatedFields extends readonly string[] = SplitByComma<SelectedField>,
  QueryByLength extends number = LengthOf<CommaSeparatedFields>,
>(
  _: Collection,
  params: SearchParams<
    Collection,
    FilterBy,
    SortBy,
    SelectedField,
    CommaSeparatedFields,
    QueryByLength
  >,
): SearchParams<Collection, FilterBy, SortBy, SelectedField, CommaSeparatedFields, QueryByLength> {
  return params;
}

const usersSchema = defineCollection({
  name: "users",
  fields: {
    id: { type: "string", optional: false, name: "id" },
    name: { type: "string", optional: false, name: "name", facet: true },
    age: { type: "int32", optional: false, sort: true, name: "age", facet: true, infix: true },
    email: { type: "string", optional: true, name: "email" },
  },
});

const test = createSearchParams(usersSchema, {
  q: "name,age",
  query_by_weights: [1, 2, 5],
  facet_query: "name:john",
  query_by: "age,email,name",
  sort_by: "_eval([(age:>5):5]):asc, age:desc",
  facet_by: "name,age",
});

// New type to ensure preset names match in the consumer code
export type EnsureCorrectPresetNames<T, AllowedNames extends string> = {
  [K in keyof T]: K extends AllowedNames ? T[K] : never;
};

// Helper type to extract preset names from an object of NamedPresets
export type PresetNames<T> = {
  [K in keyof T]: T[K] extends NamedPreset<infer Name, unknown> ? Name : never;
}[keyof T];

// Helper type to create the PresetRegistry from an object of NamedPresets
export type CreatePresetRegistry<T> = EnsureCorrectPresetNames<
  {
    [K in keyof T]: T[K] extends NamedPreset<string, infer Preset> ? Preset : never;
  },
  PresetNames<T>
>;

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

type UniqueNames<T extends PresetTuple, Acc extends PresetTuple = []> =
  T extends readonly [infer First, ...infer Rest extends PresetTuple] ?
    First extends NamedPreset<infer Name, any> ?
      Name extends Acc[number]["name"] ?
        ["Error: Duplicate preset name", Name]
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

interface A {
  name: string;
}

interface B extends A {
  name: number;
}
