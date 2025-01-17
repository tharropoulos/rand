import type {
  CollectionCreateSchema,
  CollectionFieldSchema,
  FieldType,
  SortableFields,
} from "~/collection";
import type { Parse as ParseEval } from "~/lexer/sort/eval";
import type {
  Asc,
  Colon,
  Comma,
  Desc,
  EOF,
  Ident,
  LParen,
  RParen,
  SortOrder,
  Whitespace,
} from "~/lexer/tokens";
import type { IsEmpty, ReadString, Tail } from "~/lexer/types";
import type { OmitDefaultSortingField } from "~/lib/utils";

interface EvalToken<C extends string> {
  type: "eval";
  clause: C;
}

interface ConfigToken<K extends string, V extends string> {
  type: "config";
  key: K;
  value: V;
}

type Token =
  | Ident<string, FieldType>
  | Colon
  | SortOrder
  | Comma
  | EvalToken<string>
  | ConfigToken<string, string>;

type ExtractBalancedParenthesesAndTrim<
  S extends string,
  Open extends string = LParen,
  Close extends string = RParen,
  Acc extends string = "",
  Stack extends string[] = [],
  LeftTrimmed extends boolean = false,
> =
  S extends `${infer First}${infer Rest}` ?
    LeftTrimmed extends false ?
      First extends Open ?
        ExtractBalancedParenthesesAndTrim<Rest, Open, Close, "", [Open], true>
      : [S, ""]
    : First extends Open ?
      ExtractBalancedParenthesesAndTrim<Rest, Open, Close, `${Acc}${First}`, [Open, ...Stack], true>
    : First extends Close ?
      Stack extends [Open, ...infer RestStack] ?
        RestStack extends string[] ?
          RestStack extends [] ?
            Rest extends "" ?
              [Acc, ""] // Fully balanced and trimmed
            : [Acc, Rest] // Balanced, but there's more content
          : ExtractBalancedParenthesesAndTrim<Rest, Open, Close, `${Acc}${First}`, RestStack, true>
        : ["", ""] // Unbalanced case
      : ["", ""] // Unbalanced case
    : Stack extends [] ?
      [Acc, S] // If we've already balanced all parentheses, we return what we have and the entire remaining string
    : ExtractBalancedParenthesesAndTrim<Rest, Open, Close, `${Acc}${First}`, Stack, true>
  : Stack extends [] ? [Acc, ""]
  : ["", ""]; // Unbalanced case

type ReadToken<T extends string> =
  T extends `${infer First}${infer Rest}` ?
    First extends ":" ? [Colon, Rest]
    : First extends "," ? [Comma, Rest]
    : T extends `asc${infer Rest}` ? [Asc, Rest]
    : T extends `desc${infer Rest}` ? [Desc, Rest]
    : T extends `_eval${infer Rest}` ?
      ExtractBalancedParenthesesAndTrim<Rest> extends (
        [infer Clause extends string, infer Remaining]
      ) ?
        [EvalToken<Clause>, Remaining]
      : [T, EOF]
    : ReadString<T> extends [infer Str extends string, infer Remaining] ?
      [Ident<Str, FieldType>, Remaining]
    : [T, EOF]
  : [T, EOF];

type Tokenizer<T extends string, Acc extends Token[] = []> =
  T extends `${infer First}${infer Rest}` ?
    First extends Whitespace ? Tokenizer<Rest, Acc>
    : ReadToken<T> extends [infer Tok extends Token, infer Remaining extends string] ?
      Tokenizer<Remaining, [...Acc, Tok]>
    : Acc
  : Acc;

type IsValidIdentifier<
  TCurrent extends Ident<string, FieldType>,
  TCollection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema<string, string>>, string>
  >,
  TNext extends Token[],
> =
  TCurrent["name"] extends SortableFields<TCollection["fields"]> | "_text_match_score" ?
    TNext[0] extends Colon | ConfigToken<"missing_values", "first" | "last"> ? true
    : TNext[0] extends ConfigToken<infer K, infer Val> ?
      `Invalid token sequence: configuration (${K}: ${Val}) isn't valid.`
    : `Invalid token sequence: identifier ${TCurrent["name"]} must be followed by ':' or a valid 'missing_values' config.`
  : TCurrent["name"] extends keyof TCollection["fields"] ?
    `Invalid identifier: ${TCurrent["name"]} is not a sortable field.`
  : `Invalid identifier: ${TCurrent["name"]} is not a field of collection ${TCollection["name"]}.`;

type IsValid<
  Current extends Token,
  TCollection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema>, string>
  >,
  TNext extends Token[],
> =
  Current extends Ident<string, FieldType> ? IsValidIdentifier<Current, TCollection, TNext>
  : Current extends Colon ?
    TNext[0] extends SortOrder ?
      true
    : `Invalid token sequence: ':' must be followed by 'asc' or 'desc'.`
  : Current extends SortOrder ?
    IsEmpty<TNext> extends true ? true
    : TNext[0] extends Comma ? true
    : `Invalid token sequence: sort direction must be followed by ',' or end of input.`
  : Current extends Comma ?
    TNext[0] extends Ident<string, FieldType> | EvalToken<string> ?
      true
    : `Invalid token sequence: ',' must be followed by an identifier.`
  : Current extends EvalToken<string> ? IsEvalValid<Current, TCollection, TNext>
  : Current extends ConfigToken<string, string> ?
    TNext[0] extends Colon ?
      true
    : `Invalid token sequence: config token must be followed by ':'.`
  : `Invalid token: ${Current & string}.`;

type IsEvalValid<
  CurrentToken extends EvalToken<string>,
  Collection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema>, string>
  >,
  Next extends Token[],
> =
  Next[0] extends Colon ?
    ParseEval<CurrentToken["clause"], Collection> extends infer Result ?
      Result extends true ?
        true
      : `[Error in _eval clause]: ${Result & string}.`
    : `Invalid token sequence: '_eval' must be followed by ':'.`
  : `Invalid token sequence: '_eval' must be followed by ':'.`;

type IsValidArray<
  TokenArray extends Token[],
  TCollection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema>, string>
  >,
  Acc extends Token[] = [],
> =
  TokenArray extends [infer Head extends Token, ...infer Tail extends Token[]] ?
    IsValid<Head, TCollection, Tail> extends true ?
      IsValidArray<Tail, TCollection, [...Acc, Head]>
    : IsValid<Head, TCollection, Tail>
  : IsEmpty<Acc> extends false ?
    IsValid<Acc[0], TCollection, Tail<Token, Acc>> extends true ?
      true
    : IsValid<Acc[0], TCollection, Tail<Token, Acc>>
  : true;

type Parse<
  T extends string,
  TCollection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema>, string>
  >,
> =
  Tokenizer<T> extends infer Result ?
    Result extends Token[] ?
      IsValidArray<Result, TCollection> extends infer IsValid ?
        IsValid extends true ?
          true
        : `Invalid token sequence: ${IsValid & string}`
      : `Invalid token sequence: ${Result & string}`
    : // Shouldn't ever be here
      "Invalid token sequence."
  : "Invalid token sequence.";

export type {
  Ident,
  IsValid,
  IsValidArray,
  OmitDefaultSortingField,
  Parse,
  ReadString,
  Token,
  Tokenizer,
};
