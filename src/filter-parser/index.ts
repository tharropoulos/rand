import { CollectionFieldSchema, FieldType } from "../collection";

interface Chars extends DigitMap {
  a: "a";
  b: "b";
  c: "c";
  d: "d";
  e: "e";
  f: "f";
  g: "g";
  h: "h";
  i: "i";
  j: "j";
  k: "k";
  l: "l";
  m: "m";
  n: "n";
  o: "o";
  p: "p";
  q: "q";
  r: "r";
  s: "s";
  t: "t";
  u: "u";
  v: "v";
  w: "w";
  x: "x";
  y: "y";
  z: "z";
  A: "A";
  B: "B";
  C: "C";
  D: "D";
  E: "E";
  F: "F";
  G: "G";
  H: "H";
  I: "I";
  J: "J";
  K: "K";
  L: "L";
  M: "M";
  N: "N";
  O: "O";
  P: "P";
  Q: "Q";
  R: "R";
  S: "S";
  T: "T";
  U: "U";
  V: "V";
  W: "W";
  X: "X";
  Y: "Y";
  Z: "Z";
  _: "_";
  "-": "-";
}

interface DigitMap {
  0: "0";
  1: "1";
  2: "2";
  3: "3";
  4: "4";
  5: "5";
  6: "6";
  7: "7";
  8: "8";
  9: "9";
}

type Digit = DigitMap[keyof DigitMap];
type Number = Digit | "." | "-";

interface NumToken<I extends string> {
  type: "int";
  value: I;
}

type LParen = "(";
type RParen = ")";
type LSquare = ":[";
type RSquare = "]";
type LAnd = "&&";
type LOr = "||";
type LT = ":<";
type GT = ":>";
type EQ = ":=";
type GTE = ":>=";
type LTE = ":<=";
type NEQ = ":!=";
type Colon = ":";
type Bang = ":!";
type Spread = "..";
type BrGT = ">";
type BrLT = "<";
type Comma = ",";
interface LiteralToken<T extends string> {
  type: "literal";
  value: T;
}

type Token =
  | LParen
  | RParen
  | LAnd
  | LOr
  | LT
  | GT
  | EQ
  | GTE
  | LTE
  | NEQ
  | LSquare
  | RSquare
  | Colon
  | Bang
  | BrGT
  | BrLT
  | Spread
  | Comma
  | Ident<string, FieldType>
  | NumToken<string>
  | LiteralToken<string>;

type ReadString<
  T extends string,
  Acc extends string = "",
  Rest extends string = T,
> = T extends `${infer Head}${infer Tail}`
  ? Head extends keyof Chars
    ? ReadString<Tail, `${Acc}${Head}`, Tail>
    : [Acc, Rest]
  : [Acc, Rest];

type ReadNum<
  T extends string,
  Acc extends string = "",
  Rest extends string = T,
  DotEncountered extends boolean = false,
  FirstCharProcessed extends boolean = false,
> = T extends `${infer Head}${infer Tail}`
  ? Head extends Number
    ? Head extends "."
      ? DotEncountered extends true
        ? [Acc, Rest] // Invalid if dot is encountered again
        : FirstCharProcessed extends true
        ? Tail extends `${infer Next}${infer _}`
          ? Next extends Digit
            ? ReadNum<Tail, `${Acc}${Head}`, Tail, true, true>
            : [Acc, `${Head}${Tail}`] // Break off if dot is followed by non-digit
          : [Acc, `${Head}${Tail}`] // Break off if dot is the last character
        : [Acc, Rest] // Invalid if dot is the first character
      : Head extends "-"
      ? FirstCharProcessed extends true
        ? [Acc, Rest] // Invalid if minus is not the first character
        : ReadNum<Tail, `${Acc}${Head}`, Tail, DotEncountered, true>
      : ReadNum<Tail, `${Acc}${Head}`, Tail, DotEncountered, true>
    : [Acc, Rest]
  : [Acc, Rest];

interface Ident<TName extends string, TTYpe extends FieldType> {
  name: TName;
  type: TTYpe;
}

type FieldTypeMap<T extends Record<string, CollectionFieldSchema>> = {
  [K in keyof T]: T[K]["type"];
};

type TokenMap = {
  "&&": LAnd;
  "||": LOr;
  ":=": EQ;
  ":>": GT;
  ":<": LT;
  ":<=": LTE;
  ":>=": GTE;
  ":!=": NEQ;
  ":!": Bang;
  ":": Colon;
  "(": LParen;
  ")": RParen;
  ":[": LSquare;
  "<": BrLT;
  ">": BrGT;
  "]": RSquare;
  "..": Spread;
  ",": Comma;
};

type ReadToken<
  T extends string,
  Acc extends string = "",
  Rest extends string = T,
> = T extends `${infer Head1}${infer Head2}${infer Head3}${infer Tail3}`
  ? `${Head1}${Head2}${Head3}` extends keyof TokenMap
    ? [TokenMap[`${Head1}${Head2}${Head3}`], Tail3]
    : T extends `${infer Head1}${infer Head2}${infer Tail2}`
    ? `${Head1}${Head2}` extends keyof TokenMap
      ? [TokenMap[`${Head1}${Head2}`], Tail2]
      : T extends `${infer Head}${infer Tail}`
      ? Head extends keyof TokenMap
        ? [TokenMap[Head], Tail]
        : [Acc, Rest]
      : [Acc, Rest]
    : [Acc, Rest]
  : [Acc, Rest];

type Tokenizer<
  T extends string,
  Fields extends Record<string, CollectionFieldSchema>,
  Acc extends Token[] = [],
> = T extends ""
  ? Acc
  : T extends `\`${string}\`${string}`
  ? ReadEscapeToken<T>[0] extends string
    ? Tokenizer<ReadEscapeToken<T>[1], Fields, [...Acc, LiteralToken<ReadEscapeToken<T>[0]>]>
    : never
  : ReadToken<T>[0] extends keyof TokenMap
  ? Tokenizer<ReadToken<T>[1], Fields, [...Acc, TokenMap[ReadToken<T>[0]]]>
  : T extends `${infer Head}${infer Tail}`
  ? Head extends " "
    ? Tokenizer<Tail, Fields, Acc>
    : Head extends keyof TokenMap
    ? Tokenizer<Tail, Fields, [...Acc, TokenMap[Head]]>
    : Head extends keyof Chars
    ? ReadString<T>[0] extends keyof FieldTypeMap<Fields>
      ? Tokenizer<
          ReadString<T>[1],
          Fields,
          [...Acc, Ident<ReadString<T>[0], FieldTypeMap<Fields>[ReadString<T>[0]]>]
        >
      : Tokenizer<ReadString<T>[1], Fields, [...Acc, LiteralToken<ReadString<T>[0]>]>
    : Head extends Number
    ? Tokenizer<ReadNum<T>[1], Fields, [...Acc, NumToken<ReadNum<T>[0]>]>
    : `Unknown token: ${Head}`
  : Acc;

type ReadEscapeToken<
  T extends string,
  Acc extends string = "",
  Rest extends string = T,
> = T extends `\`${infer Content}\`${infer Tail}` ? [Content, Tail] : [Acc, Rest];

type OperatorToTypeMap = {
  EQ: LiteralToken<string> | NumToken<string>;
  AEQ: LiteralToken<string> | NumToken<string>;
  NEQ: LiteralToken<string> | NumToken<string>;
  LT: NumToken<string>;
  GT: NumToken<string>;
  LTE: NumToken<string>;
  GTE: NumToken<string>;
  LOr: LParen | Ident<string, FieldType>;
  LAnd: LParen | Ident<string, FieldType>;
};

type TypeToOperatorMap = {
  string: EQ | Colon | NEQ | LSquare;
  int32: LT | GT | EQ | GTE | LTE | NEQ | LSquare;
  int64: LT | GT | EQ | GTE | LTE | NEQ | LSquare;
  float: LT | GT | EQ | GTE | LTE | NEQ | LSquare;
  bool: EQ | NEQ;
  "int32[]": LT | GT | EQ;
  "int64[]": LT | GT | EQ;
  "float[]": LT | GT | EQ;
  "bool[]": EQ;
};

type ValidNextMap<T extends Record<string, CollectionFieldSchema>> = {
  "(": Ident<string, FieldType> | LParen;
  ")": RParen | LAnd | LOr;
} & {
  [K in keyof T]: T[K]["type"] extends keyof TypeToOperatorMap
    ? TypeToOperatorMap[T[K]["type"]]
    : never;
};

type TokenType =
  | "IntToken"
  | "LiteralToken"
  | "Ident"
  | "LParen"
  | "RParen"
  | "LAnd"
  | "LOr"
  | "Comma"
  | "Spread"
  | "RSquare"
  | "BrGT"
  | "BrLT"
  | keyof OperatorMap<any>;

type IsEmpty<T extends string | any[]> = T extends "" ? true : T["length"] extends 0 ? true : false;

type OperatorMap<Fields extends Record<string, CollectionFieldSchema>> = {
  "(": { valid: Extract<Token, ValidNextMap<Fields>["("]>; empty: false };
  ")": { valid: Extract<Token, ValidNextMap<Fields>[")"]>; empty: true };
  ":<": { valid: LiteralToken<string> | NumToken<string>; empty: false };
  ":>": { valid: LiteralToken<string> | NumToken<string>; empty: false };
  ":=": { valid: LiteralToken<string> | NumToken<string>; empty: false };
  ":>=": { valid: LiteralToken<string> | NumToken<string>; empty: false };
  ":<=": { valid: LiteralToken<string> | NumToken<string>; empty: false };
  "!=": { valid: LiteralToken<string> | NumToken<string>; empty: false };
  ":": { valid: LiteralToken<string> | NumToken<string>; empty: false };
  "&&": { valid: LParen | Ident<string, FieldType>; empty: false };
  "||": { valid: LParen | Ident<string, FieldType>; empty: false };
  ":[": { valid: NumToken<string> | BrGT | BrLT | LiteralToken<string>; empty: false };
  "]": { valid: LAnd | LOr | RParen; empty: true };
  ">": { valid: NumToken<string>; empty: false };
  "<": { valid: NumToken<string>; empty: false };
  "..": { valid: NumToken<string>; empty: false };
  ",": { valid: NumToken<string> | BrGT | BrLT | LiteralToken<string>; empty: false };
};

type IsValid<
  Current extends Token,
  Fields extends Record<string, CollectionFieldSchema>,
  TNext extends Token[],
> = Current extends NumToken<string> | LiteralToken<string>
  ? IsValidValue<Current, TNext>
  : Current extends Ident<string, FieldType>
  ? IsValidIdentifier<Current, Fields, TNext>
  : Current extends keyof OperatorMap<Fields>
  ? IsValidToken<Current, Fields, TNext>
  : `Invalid token sequence: Unknown followed by ${GetTokenType<TNext[0]>}`;

type IsValidValue<
  T extends NumToken<string> | LiteralToken<string>,
  TNext extends Token[],
> = TNext[0] extends
  | RParen
  | LAnd
  | LOr
  | Comma
  | (T extends NumToken<string> ? Spread | RSquare : RSquare)
  ? true
  : IsEmpty<TNext> extends true
  ? true
  : `Invalid token sequence: ${T extends NumToken<string>
      ? `Num Token ${T["value"]}`
      : `Literal Token ${T["value"]}`} followed by ${GetTokenType<TNext[0]>}`;

type IsValidIdentifier<
  T extends Ident<string, FieldType>,
  Fields extends Record<string, CollectionFieldSchema>,
  TNext extends Token[],
> = TNext[0] extends ValidNextMap<Fields>[T["name"]]
  ? true
  : `Invalid token sequence: identifier with name ${T["name"]} followed by ${GetTokenType<
      TNext[0]
    >}`;

type IsValidToken<
  T extends keyof OperatorMap<Fields>,
  Fields extends Record<string, CollectionFieldSchema>,
  TNext extends Token[],
> = OperatorMap<Fields>[T] extends { valid: infer V; empty: infer E }
  ? TNext[0] extends V
    ? true
    : E extends true
    ? IsEmpty<TNext> extends true
      ? true
      : `Invalid token sequence: ${T} followed by ${GetTokenType<TNext[0]>}`
    : `Invalid token sequence: ${T} followed by ${GetTokenType<TNext[0]>}`
  : never;

type GetTokenType<T extends Token> = T extends NumToken<string>
  ? "num token"
  : T extends LiteralToken<string>
  ? "literal token"
  : T extends Ident<string, FieldType>
  ? "identifier"
  : T extends LParen
  ? "("
  : T extends RParen
  ? ")"
  : T extends LAnd
  ? "&&"
  : T extends LOr
  ? "||"
  : T extends Comma
  ? ","
  : T extends Spread
  ? ".."
  : T extends RSquare
  ? "]"
  : T extends BrGT
  ? ">"
  : T extends BrLT
  ? "<"
  : T extends keyof OperatorMap<any>
  ? T
  : "Unknown";

type ValidStarts = "(" | Ident<string, FieldType>;

type IsValidArray<
  TokenArray extends Token[],
  Fields extends Record<string, CollectionFieldSchema>,
  Acc extends Token[] = [],
  FirstCharProcessed extends boolean = false,
> = TokenArray extends [infer Head, ...infer Tail]
  ? Head extends Token
    ? Tail extends Token[]
      ? FirstCharProcessed extends false
        ? Head extends ValidStarts
          ? IsEmpty<Tail> extends false
            ? IsValidArray<Tail, Fields, [...Acc, Head], true>
            : `Invalid token sequence: ${GetTokenType<Head>} cannot be the only token`
          : `Invalid start token: ${GetTokenType<Head>}`
        : IsValid<Head, Fields, Tail> extends true
        ? IsValidArray<Tail, Fields, [...Acc, Head], true>
        : IsValid<Head, Fields, Tail>
      : never
    : never
  : IsEmpty<Acc> extends false
  ? IsValid<Acc[0], Fields, Tail<Acc>> extends true
    ? true
    : IsValid<Acc[0], Fields, Tail<Acc>>
  : true;

type Tail<T extends any[]> = T extends [any, ...infer U] ? U : never;

type CheckParentheses<TokenArray extends Token[], Stack extends Token[] = []> = TokenArray extends [
  infer Head,
  ...infer Tail,
]
  ? Head extends "("
    ? Tail extends Token[]
      ? CheckParentheses<Tail, [Head, ...Stack]>
      : false
    : Head extends ")"
    ? Stack extends [infer Top, ...infer Rest]
      ? Top extends "("
        ? Tail extends Token[]
          ? Rest extends Token[]
            ? CheckParentheses<Tail, Rest>
            : false
          : false
        : false
      : false
    : Tail extends Token[]
    ? CheckParentheses<Tail, Stack>
    : false
  : Stack extends []
  ? true
  : false;

type CheckSquareBrackets<
  TokenArray extends Token[],
  Stack extends Token[] = [],
> = TokenArray extends [infer Head, ...infer Tail]
  ? Head extends LSquare
    ? Tail extends Token[]
      ? CheckSquareBrackets<Tail, [Head, ...Stack]>
      : false
    : Head extends RSquare
    ? Stack extends [infer Top, ...infer Rest]
      ? Top extends LSquare
        ? Tail extends Token[]
          ? Rest extends Token[]
            ? CheckSquareBrackets<Tail, Rest>
            : false
          : false
        : false
      : false
    : Tail extends Token[]
    ? CheckSquareBrackets<Tail, Stack>
    : false
  : Stack extends []
  ? true
  : false;

type Parse<T extends string, Fields extends Record<string, CollectionFieldSchema>> = Tokenizer<
  T,
  Fields
> extends infer TokenizerResult
  ? TokenizerResult extends Token[]
    ? IsValidArray<TokenizerResult, Fields> extends infer ValidationResult
      ? ValidationResult extends true
        ? CheckParentheses<TokenizerResult> extends true
          ? CheckSquareBrackets<TokenizerResult> extends true
            ? true
            : "Square brackets are not balanced"
          : "Parentheses are not balanced"
        : ValidationResult
      : TokenizerResult
    : TokenizerResult
  : never;

export type {
  Parse,
  Tokenizer,
  Token,
  LiteralToken,
  NumToken as IntToken,
  Ident,
  ReadToken,
  ReadString,
  ReadNum,
  ReadEscapeToken,
  FieldTypeMap,
  IsEmpty,
  IsValid,
  ValidNextMap,
  TypeToOperatorMap,
  CheckParentheses,
  CheckSquareBrackets,
  IsValidArray,
};
