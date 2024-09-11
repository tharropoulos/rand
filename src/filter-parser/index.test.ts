import { expectTypeOf, describe, it } from "vitest";
import type {
  Ident,
  Tokenizer,
  IntToken,
  ReadToken,
  ReadString,
  ReadNum,
  FieldTypeMap,
  ReadEscapeToken,
  LiteralToken,
  IsEmpty,
  IsValid,
  ValidNextMap,
  TypeToOperatorMap,
  CheckParentheses,
  CheckSquareBrackets,
  IsValidArray,
  Token,
  Parse,
} from "./index";
import { defineCollectionSchema, FieldType } from "../collection";

const usersSchema = defineCollectionSchema({
  name: "users",
  fields: {
    id: { type: "string", optional: false, name: "id" },
    name: { type: "string", optional: false, name: "name" },
    age: { type: "int32", optional: false, sort: true, name: "age" },
    email: { type: "string", optional: true, name: "email" },
  },
});

describe("ReadToken tests", () => {
  it("should read an left parenthesis", () => {
    expectTypeOf<ReadToken<"( age = 20">>().toEqualTypeOf<["(", " age = 20"]>();
  });
  it("should read an right parenthesis", () => {
    expectTypeOf<ReadToken<") age = 20">>().toEqualTypeOf<[")", " age = 20"]>();
  });
  it("should read an left square bracket", () => {
    expectTypeOf<ReadToken<":[ age = 20">>().toEqualTypeOf<[":[", " age = 20"]>();
  });
  it("should read an right square bracket", () => {
    expectTypeOf<ReadToken<"] age = 20">>().toEqualTypeOf<["]", " age = 20"]>();
  });
  it("should read a greater than operator", () => {
    expectTypeOf<ReadToken<"> age = 20">>().toEqualTypeOf<[">", " age = 20"]>();
  });
  it("should read a prefixed greater than operator", () => {
    expectTypeOf<ReadToken<":> age = 20">>().toEqualTypeOf<[":>", " age = 20"]>();
  });
  it("should read a lesser than operator", () => {
    expectTypeOf<ReadToken<"< age = 20">>().toEqualTypeOf<["<", " age = 20"]>();
  });
  it("should read a prefixed lesser than operator", () => {
    expectTypeOf<ReadToken<":< age = 20">>().toEqualTypeOf<[":<", " age = 20"]>();
  });
  it("should read a greater than equal operator", () => {
    expectTypeOf<ReadToken<":>= age = 20">>().toEqualTypeOf<[":>=", " age = 20"]>();
  });
  it("should read a lesser than equal operator", () => {
    expectTypeOf<ReadToken<":<= age = 20">>().toEqualTypeOf<[":<=", " age = 20"]>();
  });
  it("should read an equal operator", () => {
    expectTypeOf<ReadToken<":= age = 20">>().toEqualTypeOf<[":=", " age = 20"]>();
  });
  it("should read a not equal operator", () => {
    expectTypeOf<ReadToken<":!= age = 20">>().toEqualTypeOf<[":!=", " age = 20"]>();
  });
  it("should read a bang operator", () => {
    expectTypeOf<ReadToken<":! age = 20">>().toEqualTypeOf<[":!", " age = 20"]>();
  });
  it("should read a colon operator", () => {
    expectTypeOf<ReadToken<": age = 20">>().toEqualTypeOf<[":", " age = 20"]>();
  });
  it("should read logical AND operator", () => {
    expectTypeOf<ReadToken<"&& age = 20">>().toEqualTypeOf<["&&", " age = 20"]>();
  });
  it("should read logical OR operator", () => {
    expectTypeOf<ReadToken<"|| age = 20">>().toEqualTypeOf<["||", " age = 20"]>();
  });
  it("should read a spread operator", () => {
    expectTypeOf<ReadToken<"... age = 20">>().toEqualTypeOf<["..", ". age = 20"]>();
  });
  it("should read a comma operator", () => {
    expectTypeOf<ReadToken<",. age = 20">>().toEqualTypeOf<[",", ". age = 20"]>();
  });
  it("should not read an illegal token", () => {
    expectTypeOf<ReadToken<" = age = 20">>().toEqualTypeOf<["", " = age = 20"]>();
    expectTypeOf<ReadToken<"= age = 20">>().toEqualTypeOf<["", "= age = 20"]>();
    expectTypeOf<ReadToken<"age := 20">>().toEqualTypeOf<["", "age := 20"]>();
  });
});

describe("ReadString tests", () => {
  it("should read a continuous string", () => {
    expectTypeOf<ReadString<"Name = John ">>().toEqualTypeOf<["Name", " = John "]>();
  });
  it("should read a continuous string with underscores", () => {
    expectTypeOf<ReadString<"_Name_under = John ">>().toEqualTypeOf<["_Name_under", " = John "]>();
  });
  it("should not read a number", () => {
    expectTypeOf<ReadString<"13 name = John ">>().toEqualTypeOf<["", "13 name = John "]>();
  });
  it("should not read a whitespace character", () => {
    expectTypeOf<ReadString<" name = John ">>().toEqualTypeOf<["", " name = John "]>();
  });
  it("should not read a token character", () => {
    expectTypeOf<ReadString<":> name = John ">>().toEqualTypeOf<["", ":> name = John "]>();
  });
});

describe("ReadNum tests", () => {
  it("should read an integer", () => {
    expectTypeOf<ReadNum<"13 name = John ">>().toEqualTypeOf<["13", " name = John "]>();
  });
  it("should not read a string", () => {
    expectTypeOf<ReadNum<"Name = John ">>().toEqualTypeOf<["", "Name = John "]>();
  });
  it("should not read a whitespace character", () => {
    expectTypeOf<ReadNum<" 13 name = John ">>().toEqualTypeOf<["", " 13 name = John "]>();
  });
  it("should not read a token character", () => {
    expectTypeOf<ReadNum<":> name = John ">>().toEqualTypeOf<["", ":> name = John "]>();
  });
  it("should read a floating point number", () => {
    expectTypeOf<ReadNum<"13.5 name = John ">>().toEqualTypeOf<["13.5", " name = John "]>();
  });
  it("should read a negative number", () => {
    expectTypeOf<ReadNum<"-13 name = John ">>().toEqualTypeOf<["-13", " name = John "]>();
  });
  it("should read a negative floating point number", () => {
    expectTypeOf<ReadNum<"-13.5 name = John ">>().toEqualTypeOf<["-13.5", " name = John "]>();
  });
  it("should only read numbers prefixed with a minus sign", () => {
    expectTypeOf<ReadNum<"13- name = John ">>().toEqualTypeOf<["13", "- name = John "]>();
  });
  it("should only read floating point numbers that have a fist digit", () => {
    expectTypeOf<ReadNum<".5 name = John ">>().toEqualTypeOf<["", ".5 name = John "]>();
  });
  it("should only read floating point numbers with a single dot character", () => {
    expectTypeOf<ReadNum<"13.0.2 name = John ">>().toEqualTypeOf<["13.0", ".2 name = John "]>();
  });
  it("should not read a floating point number with a trailing dot character", () => {
    expectTypeOf<ReadNum<"13. name = John ">>().toEqualTypeOf<["13", ". name = John "]>();
  });
});

describe("FieldTypeMap tests", () => {
  it("should map a string field type", () => {
    expectTypeOf<FieldTypeMap<typeof usersSchema.fields>>().toEqualTypeOf<{
      id: "string";
      name: "string";
      age: "int32";
      email: "string";
    }>();
  });
});

describe("ReadEscapeToken tests", () => {
  it("should read an escape token", () => {
    expectTypeOf<ReadEscapeToken<"`John()` Doe">>().toEqualTypeOf<["John()", " Doe"]>();
  });
  it("should not read an escape token that's not matched", () => {
    expectTypeOf<ReadEscapeToken<"`John() Doe">>().toEqualTypeOf<["", "`John() Doe"]>();
  });
});

describe("Tokenizer tests", () => {
  it("should tokenize a valid input string", () => {
    expectTypeOf<
      Tokenizer<
        "(age := 20) && name:[`John()`, Doe] || age:[20..30, 3.50]",
        typeof usersSchema.fields
      >
    >().toEqualTypeOf<
      [
        "(",
        Ident<"age", "int32">,
        ":=",
        IntToken<"20">,
        ")",
        "&&",
        Ident<"name", "string">,
        ":[",
        LiteralToken<`John()`>,
        ",",
        LiteralToken<"Doe">,
        "]",
        "||",
        Ident<"age", "int32">,
        ":[",
        IntToken<"20">,
        "..",
        IntToken<"30">,
        ",",
        IntToken<"3.50">,
        "]",
      ]
    >();
  });
  it("should not tokenize an invalid input string", () => {
    expectTypeOf<
      Tokenizer<"age != 20", typeof usersSchema.fields>
    >().toEqualTypeOf<"Unknown token: !">();
  });
});

describe("IsEmpty tests", () => {
  it("should return true for an empty string", () => {
    expectTypeOf<IsEmpty<"">>().toEqualTypeOf<true>();
  });

  it("should return true for an empty array", () => {
    expectTypeOf<IsEmpty<[]>>().toEqualTypeOf<true>();
  });

  it("should return 'non-empty' for a non-empty string", () => {
    expectTypeOf<IsEmpty<"non-empty">>().toEqualTypeOf<false>();
  });

  it("should return 'non-empty' for a non-empty array", () => {
    expectTypeOf<IsEmpty<[1, 2, 3]>>().toEqualTypeOf<false>();
  });

  it("should return 'non-empty' for an array with a single element", () => {
    expectTypeOf<IsEmpty<[1]>>().toEqualTypeOf<false>();
  });

  it("should return 'non-empty' for a string with a single character", () => {
    expectTypeOf<IsEmpty<"a">>().toEqualTypeOf<false>();
  });
});

describe("IsValid type tests", () => {
  describe("Left Parenthesis", () => {
    it("should validate a left parenthesis followed by an identifier", () => {
      expectTypeOf<
        IsValid<"(", typeof usersSchema.fields, [Ident<"age", "int32">]>
      >().toEqualTypeOf<true>();
    });

    it("should invalidate a left parenthesis followed by a right parenthesis", () => {
      expectTypeOf<
        IsValid<"(", typeof usersSchema.fields, [")"]>
      >().toEqualTypeOf<"Invalid token sequence: ( followed by )">();
    });
  });

  describe("Identifier", () => {
    it("should validate an identifier followed by an operator", () => {
      expectTypeOf<
        IsValid<Ident<"name", "string">, typeof usersSchema.fields, [":", LiteralToken<"t">]>
      >().toEqualTypeOf<true>();
    });

    it("should invalidate an identifier followed by an invalid operator", () => {
      expectTypeOf<
        IsValid<Ident<"age", "int32">, typeof usersSchema.fields, [":"]>
      >().toEqualTypeOf<"Invalid token sequence: identifier with name age followed by :">();
    });
    it("should invalidate an identifier followed by another identifier", () => {
      expectTypeOf<
        IsValid<Ident<"age", "int32">, typeof usersSchema.fields, [Ident<"name", "string">]>
      >().toEqualTypeOf<"Invalid token sequence: identifier with name age followed by identifier">();
    });
  });

  describe("Right Parenthesis", () => {
    it("should validate a right parenthesis followed by a logical AND operator", () => {
      expectTypeOf<IsValid<")", typeof usersSchema.fields, ["&&"]>>().toEqualTypeOf<true>();
    });

    it("should invalidate a right parenthesis followed by an identifier", () => {
      expectTypeOf<
        IsValid<")", typeof usersSchema.fields, [Ident<"age", "int32">]>
      >().toEqualTypeOf<"Invalid token sequence: ) followed by identifier">();
    });
  });

  describe("Operators", () => {
    it("should validate an operator followed by a literal token", () => {
      expectTypeOf<
        IsValid<":", typeof usersSchema.fields, [LiteralToken<"John">]>
      >().toEqualTypeOf<true>();
    });

    it("should invalidate an operator followed by another operator", () => {
      expectTypeOf<
        IsValid<":", typeof usersSchema.fields, [":"]>
      >().toEqualTypeOf<"Invalid token sequence: : followed by :">();
    });
  });

  describe("Logical Operators", () => {
    it("should validate a logical operator followed by a left parenthesis", () => {
      expectTypeOf<IsValid<"&&", typeof usersSchema.fields, ["("]>>().toEqualTypeOf<true>();
    });

    it("should invalidate a logical operator followed by another logical operator", () => {
      expectTypeOf<
        IsValid<"&&", typeof usersSchema.fields, ["&&"]>
      >().toEqualTypeOf<"Invalid token sequence: && followed by &&">();
    });
  });

  describe("Literal Tokens", () => {
    it("should validate a literal token followed by a right parenthesis", () => {
      expectTypeOf<
        IsValid<LiteralToken<"John">, typeof usersSchema.fields, [")"]>
      >().toEqualTypeOf<true>();
    });
    it("should invalidate a literal token followed by an identifier", () => {
      expectTypeOf<
        IsValid<LiteralToken<"John">, typeof usersSchema.fields, [Ident<"age", "int32">]>
      >().toEqualTypeOf<"Invalid token sequence: Literal Token John followed by identifier">();
    });
  });

  describe("Integer Tokens", () => {
    it("should validate an integer token followed by a right parenthesis", () => {
      expectTypeOf<
        IsValid<IntToken<"20">, typeof usersSchema.fields, [")"]>
      >().toEqualTypeOf<true>();
    });

    it("should invalidate an integer token followed by an identifier", () => {
      expectTypeOf<
        IsValid<IntToken<"20">, typeof usersSchema.fields, [Ident<"age", "int32">]>
      >().toEqualTypeOf<"Invalid token sequence: Num Token 20 followed by identifier">();
    });
  });

  describe("Left Square Bracket", () => {
    it("should validate a left square bracket followed by an integer token", () => {
      expectTypeOf<
        IsValid<Ident<"age", "int32">, typeof usersSchema.fields, [":[", IntToken<"20">]>
      >().toEqualTypeOf<true>();
    });

    it("should invalidate a left square bracket followed by a right parenthesis", () => {
      expectTypeOf<
        IsValid<":[", typeof usersSchema.fields, [")"]>
      >().toEqualTypeOf<"Invalid token sequence: :[ followed by )">();
    });
  });

  describe("Right Square Bracket", () => {
    it("should validate a right square bracket followed by a logical AND operator", () => {
      expectTypeOf<IsValid<"]", typeof usersSchema.fields, ["&&"]>>().toEqualTypeOf<true>();
    });

    it("should invalidate a right square bracket followed by an identifier", () => {
      expectTypeOf<
        IsValid<"]", typeof usersSchema.fields, [Ident<"age", "int32">]>
      >().toEqualTypeOf<"Invalid token sequence: ] followed by identifier">();
    });
  });

  describe("Comma", () => {
    it("should validate a comma followed by an integer token", () => {
      expectTypeOf<
        IsValid<",", typeof usersSchema.fields, [IntToken<"20">]>
      >().toEqualTypeOf<true>();
    });

    type t = IsValid<",", typeof usersSchema.fields, [")"]>;
    it("should invalidate a comma followed by a right parenthesis", () => {
      expectTypeOf<
        IsValid<",", typeof usersSchema.fields, [")"]>
      >().toEqualTypeOf<"Invalid token sequence: , followed by )">();
    });
  });

  describe("Spread", () => {
    it("should validate a spread operator followed by an integer token", () => {
      expectTypeOf<
        IsValid<"..", typeof usersSchema.fields, [IntToken<"30">]>
      >().toEqualTypeOf<true>();
    });

    it("should invalidate a spread operator followed by a right parenthesis", () => {
      expectTypeOf<
        IsValid<"..", typeof usersSchema.fields, [")"]>
      >().toEqualTypeOf<"Invalid token sequence: .. followed by )">();
    });
  });
});

describe("ValidNextMap tests", () => {
  it("should validate next token for left parenthesis", () => {
    expectTypeOf<ValidNextMap<typeof usersSchema.fields>["("]>().toEqualTypeOf<
      "(" | Ident<string, FieldType>
    >();
  });

  it("should validate next token for right parenthesis", () => {
    expectTypeOf<ValidNextMap<typeof usersSchema.fields>[")"]>().toEqualTypeOf<")" | "&&" | "||">();
  });

  it("should validate next token for string field type", () => {
    expectTypeOf<ValidNextMap<typeof usersSchema.fields>["id"]>().toEqualTypeOf<
      ":=" | ":!=" | ":" | ":["
    >();
  });

  it("should validate next token for int32 field type", () => {
    expectTypeOf<ValidNextMap<typeof usersSchema.fields>["age"]>().toEqualTypeOf<
      ":[" | ":<" | ":>" | ":=" | ":>=" | ":<=" | ":!="
    >();
  });
});

describe("TypeToOperatorMap tests", () => {
  it("should map string field type to correct operators", () => {
    expectTypeOf<TypeToOperatorMap["string"]>().toEqualTypeOf<":=" | ":" | ":!=" | ":[">();
  });

  it("should map int32 field type to correct operators", () => {
    expectTypeOf<TypeToOperatorMap["int32"]>().toEqualTypeOf<
      ":<" | ":>" | ":=" | ":>=" | ":<=" | ":!=" | ":["
    >();
  });

  it("should map int64 field type to correct operators", () => {
    expectTypeOf<TypeToOperatorMap["int64"]>().toEqualTypeOf<
      ":<" | ":>" | ":=" | ":>=" | ":<=" | ":!=" | ":["
    >();
  });

  it("should map float field type to correct operators", () => {
    expectTypeOf<TypeToOperatorMap["float"]>().toEqualTypeOf<
      ":<" | ":>" | ":=" | ":>=" | ":<=" | ":!=" | ":["
    >();
  });

  it("should map bool field type to correct operators", () => {
    expectTypeOf<TypeToOperatorMap["bool"]>().toEqualTypeOf<":=" | ":!=">();
  });

  it("should map int32[] field type to correct operators", () => {
    expectTypeOf<TypeToOperatorMap["int32[]"]>().toEqualTypeOf<":<" | ":>" | ":=">();
  });

  it("should map int64[] field type to correct operators", () => {
    expectTypeOf<TypeToOperatorMap["int64[]"]>().toEqualTypeOf<":<" | ":>" | ":=">();
  });

  it("should map float[] field type to correct operators", () => {
    expectTypeOf<TypeToOperatorMap["float[]"]>().toEqualTypeOf<":<" | ":>" | ":=">();
  });

  it("should map bool[] field type to correct operators", () => {
    expectTypeOf<TypeToOperatorMap["bool[]"]>().toEqualTypeOf<":=">();
  });
});

describe("CheckParentheses tests", () => {
  it("should return true for balanced parentheses", () => {
    expectTypeOf<CheckParentheses<["(", ")", "(", ")"]>>().toEqualTypeOf<true>();
  });

  it("should return false for unbalanced parentheses (more opening)", () => {
    expectTypeOf<CheckParentheses<["(", "(", ")"]>>().toEqualTypeOf<false>();
  });

  it("should return false for unbalanced parentheses (more closing)", () => {
    expectTypeOf<CheckParentheses<[")", "(", ")"]>>().toEqualTypeOf<false>();
  });

  it("should return true for nested balanced parentheses", () => {
    expectTypeOf<CheckParentheses<["(", "(", ")", ")"]>>().toEqualTypeOf<true>();
  });

  it("should return false for nested unbalanced parentheses", () => {
    expectTypeOf<CheckParentheses<["(", "(", ")"]>>().toEqualTypeOf<false>();
  });

  it("should return true for Tokens without parentheses", () => {
    expectTypeOf<CheckParentheses<[LiteralToken<"Name">, IntToken<"30">]>>().toEqualTypeOf<true>();
  });

  it("should return true for empty array", () => {
    expectTypeOf<CheckParentheses<[]>>().toEqualTypeOf<true>();
  });
});

describe("CheckSquareBrackets tests", () => {
  it("should return true for balanced square brackets", () => {
    expectTypeOf<CheckSquareBrackets<[":[", "]"]>>().toEqualTypeOf<true>();
    expectTypeOf<CheckSquareBrackets<[":[", "(", ")", "]"]>>().toEqualTypeOf<true>();
    expectTypeOf<CheckSquareBrackets<[":[", ":[", "]", "]"]>>().toEqualTypeOf<true>();
    expectTypeOf<CheckSquareBrackets<[":[", ":[", ":[", "]", "]", "]"]>>().toEqualTypeOf<true>();
  });

  it("should return false for unbalanced square brackets (more opening)", () => {
    expectTypeOf<CheckSquareBrackets<[":[", ":[", "]"]>>().toEqualTypeOf<false>();
    expectTypeOf<CheckSquareBrackets<[":[", ":[", ":[", "]", "]"]>>().toEqualTypeOf<false>();
  });

  it("should return false for unbalanced square brackets (more closing)", () => {
    expectTypeOf<CheckSquareBrackets<[":[", "]", "]"]>>().toEqualTypeOf<false>();
    expectTypeOf<CheckSquareBrackets<[":[", ":[", "]", "]", "]"]>>().toEqualTypeOf<false>();
  });

  it("should return false for unbalanced square brackets with other tokens", () => {
    expectTypeOf<CheckSquareBrackets<[":[", "(", ")"]>>().toEqualTypeOf<false>();
    expectTypeOf<CheckSquareBrackets<[":[", "(", ")", "]", "]"]>>().toEqualTypeOf<false>();
  });

  it("should return true for balanced square brackets with other tokens", () => {
    expectTypeOf<CheckSquareBrackets<[":[", "(", ")", ":[", "]", "]"]>>().toEqualTypeOf<true>();
    expectTypeOf<
      CheckSquareBrackets<[":[", "(", ")", ":[", ":[", "]", "]", "]"]>
    >().toEqualTypeOf<true>();
  });

  it("should return true for empty token array", () => {
    expectTypeOf<CheckSquareBrackets<[]>>().toEqualTypeOf<true>();
  });
});
describe("IsValidArray tests", () => {
  it("should return true for an empty array", () => {
    expectTypeOf<IsValidArray<[], typeof usersSchema.fields>>().toEqualTypeOf<true>();
  });

  it("should return false for a single valid token", () => {
    expectTypeOf<
      IsValidArray<["("], typeof usersSchema.fields>
    >().toEqualTypeOf<"Invalid token sequence: ( cannot be the only token">();
  });

  it("should return true for a sequence of valid tokens", () => {
    expectTypeOf<
      IsValidArray<
        [
          "(",
          Ident<"age", "int32">,
          ":=",
          IntToken<"20">,
          ")",
          "&&",
          Ident<"name", "string">,
          ":[",
          LiteralToken<"John">,
          ",",
          LiteralToken<"Doe">,
          "]",
        ],
        typeof usersSchema.fields
      >
    >().toEqualTypeOf<true>();
  });

  it("should return false for a sequence with an invalid token", () => {
    expectTypeOf<
      IsValidArray<
        ["(", Ident<"age", "int32">, ":=", IntToken<"20">, ")", "&&", LiteralToken<"John">],
        typeof usersSchema.fields
      >
    >().toEqualTypeOf<"Invalid token sequence: && followed by literal token">();
  });

  it("should return false for a sequence with an invalid starting token", () => {
    expectTypeOf<
      IsValidArray<[":=", IntToken<"20">, ")"], typeof usersSchema.fields>
    >().toEqualTypeOf<"Invalid start token: :=">();
  });

  it("should return false for a sequence with an invalid transition", () => {
    expectTypeOf<
      IsValidArray<
        ["(", Ident<"age", "int32">, ":=", IntToken<"20">, Ident<"name", "string">],
        typeof usersSchema.fields
      >
    >().toEqualTypeOf<"Invalid token sequence: Num Token 20 followed by identifier">();
  });
});

describe("Parse tests", () => {
  it("should parse a valid filter string", () => {
    expectTypeOf<
      Parse<
        "(age := 30) && name:[`Alice(!)`, `Bob`] || (name:[Kostas, Giannis] && age:[30..20, 50]) && email:=`kostas@gmail.com` || age:=30 && name:[`Alice`, `Bob`] && email:[`john@mail.en`, Acm]",
        typeof usersSchema.fields
      >
    >().toEqualTypeOf<true>();
  });

  it("should fail parsing due to unbalanced parentheses", () => {
    expectTypeOf<
      Parse<"(age := 30 && name:[`Alice`, `Bob`]", typeof usersSchema.fields>
    >().toEqualTypeOf<"Parentheses are not balanced">();
  });

  it("should fail parsing due to unbalanced square brackets", () => {
    expectTypeOf<
      Parse<"(age := 30) && name:[`Alice`, `Bob`", typeof usersSchema.fields>
    >().toEqualTypeOf<"Square brackets are not balanced">();
  });

  it("should fail parsing due to invalid token", () => {
    expectTypeOf<
      Parse<"(age := 30) && name:[`Alice`, `Bob`", typeof usersSchema.fields>
    >().toEqualTypeOf<"Square brackets are not balanced">();
  });

  it("should parse a valid filter string with logical operators", () => {
    expectTypeOf<
      Parse<"(age := 30) || (email := `alice@example.com`)", typeof usersSchema.fields>
    >().toEqualTypeOf<true>();
  });

  it("should fail parsing due to invalid token sequence", () => {
    expectTypeOf<
      Parse<"(age := 30) && && name:[`Alice`, `Bob`]", typeof usersSchema.fields>
    >().toEqualTypeOf<"Invalid token sequence: && followed by &&">();
  });

  it("should parse a valid filter string with nested parentheses", () => {
    expectTypeOf<
      Parse<"((age := 30) && (email := `alice@example.com`))", typeof usersSchema.fields>
    >().toEqualTypeOf<true>();
  });

  it("should fail parsing due to invalid identifier", () => {
    expectTypeOf<
      Parse<"(invalidField := 30) && name:[`Alice`, `Bob`]", typeof usersSchema.fields>
    >().toEqualTypeOf<"Invalid token sequence: Literal Token invalidField followed by :=">();
  });

  it("should fail parsing due to a tokenizer error", () => {
    expectTypeOf<
      Parse<"age != 20", typeof usersSchema.fields>
    >().toEqualTypeOf<"Unknown token: !">();
  });
});
