// Minimal ambient types for `expr-eval` (the npm package ships no .d.ts and we
// intentionally do NOT depend on @types/expr-eval). Only the surface used by
// lib/toolCompute.ts is declared. Kept inside an owned path so the backend
// package compiles once `expr-eval` is installed, with no extra type dep.
declare module 'expr-eval' {
  export interface Expression {
    evaluate(scope?: Record<string, unknown>): unknown;
    variables(options?: { withMembers?: boolean }): string[];
    toString(): string;
  }

  export interface ParserOptions {
    operators?: {
      add?: boolean;
      concatenate?: boolean;
      conditional?: boolean;
      divide?: boolean;
      factorial?: boolean;
      multiply?: boolean;
      power?: boolean;
      remainder?: boolean;
      subtract?: boolean;
      logical?: boolean;
      comparison?: boolean;
      in?: boolean;
      assignment?: boolean;
      array?: boolean;
      fndef?: boolean;
    };
  }

  export class Parser {
    constructor(options?: ParserOptions);
    functions: Record<string, (...args: number[]) => number>;
    consts: Record<string, unknown>;
    parse(expression: string): Expression;
    evaluate(expression: string, values?: Record<string, unknown>): unknown;
    static parse(expression: string): Expression;
  }
}
