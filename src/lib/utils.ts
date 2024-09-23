/**
 * Remove the `default_sorting_field` key from a record.
 * Useful for guarding types with a type of collection schema, for objects that may or may not have
 * a `default_sorting_field` key.
 * @template T - Any record that has a key of `default_sorting_field`.
 */
type OmitDefaultSortingField<T> = Omit<T, "default_sorting_field">;

/**
 * Useful for `type instantiation is excessively deep and possibly infinite` errors.
 * [Reference](https://x.com/solinvictvs/status/1671507561143476226)
 * @template T - The type to recurse.
 */
type Recurse<T> = T extends infer R ? R : never;

declare const __brand: unique symbol;
/**
 * A type that represents a brand. Used for nominal-like typing.
 */
type Brand<B> = { [__brand]: B };

/**
 * A type that represents a branded string type.
 *
 */
type Branded<T, B> = T & Brand<B>;

export type { Branded, OmitDefaultSortingField, Recurse };
