import type { OmitDefaultSortingField } from ".";
import { type CollectionCreateSchema, type CollectionFieldSchema } from "../../collection";
import type { Recurse } from "../../lib/utils";
import type { Parse as ParseFilter } from "../filter";
import type { Colon, Comma, Digit, EOF, LSquare, NumToken, RSquare, Whitespace } from "../tokens";
import type { CheckBalancedTokens, IsEmpty, ReadNum, Tail } from "../types";

interface FilterClause<C extends string, I extends boolean> {
  type: "filter";
  clause: C;
  in_range: I;
}

type Token = FilterClause<string, boolean> | NumToken<string> | Colon | Comma | LSquare | RSquare;

type ReadToken<T extends string> =
  T extends `[${infer Rest}` ? [LSquare, Rest]
  : T extends `]${infer Rest}` ? [RSquare, Rest]
  : T extends `:${infer Rest}` ? [Colon, Rest]
  : T extends `,${infer Rest}` ? [Comma, Rest]
  : T extends `(${infer Clause}):${infer Rest}` ? [FilterClause<Clause, true>, Rest]
  : T extends `${Digit}${string}` ?
    ReadNum<T> extends [infer R extends string, infer Rest] ?
      [NumToken<R>, Rest]
    : [EOF, T]
  : T extends `${infer Clause}` ? [FilterClause<Clause, false>, EOF]
  : [EOF, T];

type Tokenizer<T extends string, Acc extends Token[] = []> =
  T extends EOF ? Acc
  : T extends `${Whitespace}${infer Rest}` ? Tokenizer<Rest, Acc>
  : ReadToken<T> extends [infer TokenType, infer Rest extends string] ?
    TokenType extends Token ?
      Tokenizer<Rest, [...Acc, TokenType]>
    : Acc
  : Acc;

type IsValidArrayIterative<
  TokenArray extends Token[],
  Collection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema>, string>
  >,
> =
  {
    [K in keyof TokenArray]: IsValid<TokenArray[K], Collection, Tail<Token, TokenArray>>;
  }[number] extends true ?
    true
  : false;

type IsValid<
  Current extends Token,
  Collection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema>, string>
  >,
  RemainingTokens extends Token[],
> =
  Current extends LSquare ?
    RemainingTokens[0] extends FilterClause<string, true> ?
      true
    : `Invalid token after '[', expected filter`
  : Current extends FilterClause<infer Clause, true> ?
    RemainingTokens[0] extends NumToken<string> ?
      ParseFilter<Clause, Collection> extends infer Result ?
        Result extends true ?
          true
        : `[Error on filter]: ${Result & string}`
      : `[Error on filter]: couldn't parse filter`
    : `Invalid token after filter, expected a number`
  : Current extends Colon ?
    RemainingTokens[0] extends NumToken<string> ?
      true
    : `Invalid token after ':', expected number`
  : Current extends Comma ?
    RemainingTokens[0] extends FilterClause<string, true> ?
      true
    : `Invalid token after ',', expected filter`
  : Current extends RSquare ?
    IsEmpty<RemainingTokens> extends true ? true
    : RemainingTokens[0] extends EOF ? true
    : `Invalid token after ']', expected EOF`
  : Current extends string ? `Invalid token: ${Current}`
  : Current extends FilterClause<infer Clause, false> ?
    IsEmpty<RemainingTokens> extends true ?
      ParseFilter<Clause, Collection> extends infer Result ?
        Result extends true ?
          true
        : `[Error on filter]: ${Result & string}`
      : `[Error on filter]: couldn't parse filter`
    : `Invalid token: a filter must be the only token in an _eval`
  : Current extends NumToken<string> ?
    RemainingTokens[0] extends Comma | RSquare ?
      true
    : `Invalid token after number, expected ',' or ']'`
  : Current extends string ? `Invalid token: ${Current}`
  : "Invalid token";

type IsValidArray<
  TokenArray extends Token[],
  Collection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema>, string>
  >,
  Acc extends Token[] = [],
> =
  TokenArray extends [infer Head extends Token, ...infer Tail extends Token[]] ?
    IsValid<Head, Collection, Tail> extends true ?
      IsValidArray<Tail, Collection, [...Acc, Head]>
    : IsValid<Head, Collection, Tail>
  : IsEmpty<Acc> extends false ?
    IsValid<Acc[0], Collection, Tail<Token, Acc>> extends true ?
      true
    : IsValid<Acc[0], Collection, Tail<Token, Acc>>
  : true;

type CheckSquareBrackets<TokenArray extends Token[]> = CheckBalancedTokens<
  Token,
  TokenArray,
  [LSquare, RSquare]
>;

type Parse<
  T extends string,
  Collection extends OmitDefaultSortingField<
    CollectionCreateSchema<Record<string, CollectionFieldSchema<string, string>>, string>
  >,
> = Recurse<
  Tokenizer<T> extends infer Tokens extends Token[] ?
    // If the tokenizer is successful, check if the tokens are valid
    IsValidArrayIterative<Tokens, Collection> extends infer IsValid ?
      IsValid extends true ?
        // If the tokens are valid, check if the parentheses and square brackets are balanced
        CheckSquareBrackets<Tokens> extends true ?
          true
        : "Square brackets are not balanced"
      : IsValid
    : `Invalid token sequence: ${Tokens & string}`
  : Tokenizer<T>
>;

export type { Parse };
