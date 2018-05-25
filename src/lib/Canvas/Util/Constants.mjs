export const SPLIT_METHODS = /(?<=\))\s*\./;
export const METHOD_PARSE = /^\.?(\w+)\((.*)\)$/;
export const CANVAS_HEADER = /^new Canvas(?:Constructor)?\s*\((\d+(?:\.\d*)?), *(\d+(?:\.\d*)?)\)\s*/;
export const QUOTES = /'|"|`/;
export const NUMBER = /\d/;
export const CHAR = /[a-zA-Z_]/;
export const VARCHAR = /[a-zA-Z0-9_]/;
export const SPACE = /\s/;
