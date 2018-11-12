import { Linter } from 'eslint';
import { rules } from './rules';

export const CODEBLOCK_REGEXP = /```(?:js|javascript)([\s\S]+)```/;
export const linter = new Linter();

export function checkErrors(code: string): Linter.LintMessage[] {
	return linter.verify(code, rules);
}

export function fixErrors(code: string): Linter.FixReport {
	return linter.verifyAndFix(code, rules);
}
