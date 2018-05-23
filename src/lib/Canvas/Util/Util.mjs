import { ArgumentParseError } from './ValidateError';
import Method from '../Parser/Method';

export async function multiOptions(options, arg, given) {
	given = await Method._validateArg({ ...arg, type: 'string' }, given);
	if (options.includes(given)) return given;
	throw new ArgumentParseError(arg, `Value must be 'bevel', 'round', or 'miter'. Got: '${given}'`);
}
