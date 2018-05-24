import {
	ValidateError,
	RequiredArgumentError,
	UnknownArgumentPropertyError,
	IncorrectArgumentError,
	ArgumentParseError
} from '../Util/ValidateError.mjs';
import { get } from 'snekfetch';
import { ArgumentParser } from './ArgumentParser.mjs';
import { Argument } from './Argument.mjs';

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

	add(options) {
		this.arguments.push(new Argument({ parent: this, ...options }));
		if (options.required) this.required++;

		return this;
	}

	async validate(params) {
		const parser = new ArgumentParser(params);
		const parsed = parser.parse();
		parser.dispose();

		if (parsed.length < this.required) throw new RequiredArgumentError(this.arguments[parsed.length]);

		const output = [];
		for (let i = 0; i < parsed.length; i++)
			output[i] = await Method._validateArg(this.arguments[i], parsed[i].value);

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
			case 'number': return Method._validateArgNumber(arg, input);
			case 'string': return Method._validateArgString(arg, input);
			case 'boolean': return Method._validateArgBoolean(arg, input);
			case 'buffer': return Method._validateArgBuffer(arg, input);
			case 'object': return Method._validateArgObject(arg, input);
			case 'custom': {
				if (typeof arg.custom !== 'function') throw new Error(`${arg.parent.name}::${arg.name} does not have the resolver.`);
				return arg.custom(arg, input);
			}
			default:
				throw new Error(`${arg.parent.name}::${arg.name} has an unknown type (${arg.type}), please report this to this bot's owners.`);
		}
	}

	static _validateArgNumber(arg, input) {
		if (typeof input === 'number') return input;
		throw new IncorrectArgumentError(arg, input);
	}

	static _validateArgString(arg, input) {
		if (typeof input === 'string') return input;
		throw new IncorrectArgumentError(arg, input);
	}

	static _validateArgBoolean(arg, input) {
		if (typeof input === 'boolean') return input;
		throw new IncorrectArgumentError(arg, input);
	}

	static async _validateArgBuffer(arg, input) {
		const link = Method._validateArgString({ ...arg, type: 'string' }, input);

		try {
			const url = new URL(link);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') throw { message: `${url.href} is not a valid URL.` };
			return get(url.href)
				.then(result => result.body)
				.catch(() => { throw { message: `Cannot get ${url.href}` }; });
		} catch (error) {
			throw new ArgumentParseError(arg, `Failed to parse link: ${error.message}`);
		}
	}

	static async _validateArgObject(arg, input) {
		try {
			if (!arg.properties) return input;
			const keys = Object.keys(input);
			for (const key of keys) {
				if (!arg.properties.has(key)) throw new UnknownArgumentPropertyError(arg, key);
				input[key] = await Method._validateArg(arg.properties.get(key), input[key]);
			}
			return input;
		} catch (error) {
			if (error instanceof ValidateError) throw error;
			throw new ArgumentParseError(arg, `Failed to parse JSON object: ${error.message}`);
		}
	}

}
