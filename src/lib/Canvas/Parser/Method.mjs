import {
	ValidateError,
	RequiredArgumentError,
	UnknownArgumentPropertyError,
	IncorrectArgumentError,
	ArgumentParseError
} from '../Util/ValidateError.mjs';
import { get } from 'snekfetch';
import { util } from 'klasa';

export default class Method {

	/**
	 * @typedef {Object} Argument
	 * @property {Method} parent
	 * @property {string} name
	 * @property {boolean} required
	 * @property {string} type
	 * @property {Map<string, Argument>} [properties]
	 * @property {Function} [custom]
	 */

	constructor(name) {
		this.name = name;
		this.arguments = [];
		this.required = 0;
	}

	add({ name, required = false, custom, type = typeof custom === 'function' ? 'custom' : null, properties = null }) {
		this.arguments.push({ parent: this, name, required, type, custom, properties });
		if (required) this.required++;

		return this;
	}

	async validate(params) {
		const parsed = params.split(',').map(param => param.trim());
		if (parsed.length < this.required) throw new RequiredArgumentError(this.arguments[parsed.length]);

		const output = [];
		for (let i = 0; i < parsed.length; i++)
			output[i] = await Method._validateArg(this.arguments[i], parsed[i]);

		return output;
	}

	/**
	 * Validate an argument
	 * @param {Argument} arg The argument to parse
	 * @param {string} input The input from the user
	 * @returns {any}
	 */
	static async _validateArg(arg, input) {
		switch (arg.type) {
			case 'number': {
				const parsed = Number(input);
				if (util.isNumber(parsed)) return parsed;
				throw new IncorrectArgumentError(arg, input);
			}
			case 'string': {
				const firstChar = input.charAt(0);
				const lastChar = input.charAt(input.length - 1);
				if (firstChar !== lastChar) throw new ArgumentParseError(arg, 'Failed to parse string: Mismatching quotes.');

				let quotes = 0, point = 0;
				while (point < input.length) {
					const char = input.charAt(point);
					if (char === '\\') {
						point += 2;
					} else {
						if (char === firstChar) quotes++;
						point++;
					}
				}

				if (quotes % 2 !== 0) throw new ArgumentParseError(arg, 'Failed to parse string: Unescaped string literals.');

				return input.substring(1, input.length - 1);
			}
			case 'buffer': {
				const link = await Method._validateArg({ ...arg, type: 'string' }, input);

				try {
					const url = new URL(link);
					return get(url.href)
						.then(result => result.body)
						.catch(() => { throw { message: `Cannot get ${url.href}` }; });
				} catch (error) {
					throw new ArgumentParseError(arg, `Failed to parse link: ${error.message}`);
				}
			}
			case 'object': {
				try {
					const parsed = JSON.parse(input);
					if (!arg.properties) return parsed;
					const keys = Object.keys(parsed);
					for (const key of keys) {
						if (!arg.properties.has(key)) throw new UnknownArgumentPropertyError(arg, key);
						parsed[key] = await Method._validateArg(arg.properties.get(key), parsed[key]);
					}
					return parsed;
				} catch (error) {
					if (error instanceof ValidateError) throw error;
					throw new ArgumentParseError(arg, `Failed to parse JSON object: ${error.message}`);
				}
			}
			case 'custom': {
				if (typeof arg.custom !== 'function') throw new Error(`${arg.parent.name}::${arg.name} does not have the resolver.`);
				return arg.custom(arg, input);
			}
			default:
				throw new Error(`${arg.parent.name}::${arg.name} has an unknown type, please report this to this bot's owners.`);
		}
	}

}
