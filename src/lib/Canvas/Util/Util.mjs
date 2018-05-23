import { ArgumentParseError } from './ValidateError';
import Method from '../Parser/Method';

export async function multiOptions(options, arg, given) {
	given = await Method._validateArg({ ...arg, type: 'string' }, given);
	if (options.includes(given)) return given;
	throw new ArgumentParseError(arg, `Value must be ${listOptions(options)}. Got: '${given}'`);
}

export function listOptions(options) {
	switch (options.length) {
		case 0: return 'None';
		case 1: return `'${options[0]}'`;
		case 2: return `'${options[0]}' or '${options[1]}'`;
		default: {
			const clone = options.slice();
			const last = clone.pop();
			return `${clone.map(el => `'${el}'`).join(', ')}, or '${last}'`;
		}
	}
}
