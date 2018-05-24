export const SPLIT_METHODS = /(?<=\))\s*\./;
export const METHOD_PARSE = /^\.?(\w+)\((.*)\)$/;
export const CANVAS_HEADER = /^new Canvas(?:Constructor)?\s*\((\d{1,4}), *(\d{1,4})\)\s*/;
export const QUOTES = /'|"|`/;
export const NUMBER = /\d/;
export const CHAR = /[a-zA-Z]/;
export const VARCHAR = /[a-zA-Z0-9]/;
export const SPACE = /\s/;
