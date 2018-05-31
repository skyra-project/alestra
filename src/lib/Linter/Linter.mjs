import rules from './rules';
import { default as eslint } from 'eslint';

export const CODEBLOCK_REGEXP = /```(?:js|javascript)([\s\S]+)```/;

export function checkErrors(code) {
	return eslint.linter.verify(code, rules);
}

export function fixErrors(code) {
	return eslint.linter.verifyAndFix(code, rules);
}
