import {
	ValidateError,
	RequiredArgumentError,
	UnknownArgumentPropertyError,
	IncorrectArgumentError,
	ArgumentParseError,
	TooManyArgumentsMethodError
} from '../Util/ValidateError.mjs';
import Argument from './Argument.mjs';
import fetch from 'node-fetch';

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

	async validate(args, vars) {
		if (args.length < this.required) throw new RequiredArgumentError(this.arguments[args.length]);
		if (args.length > this.arguments.length) throw new TooManyArgumentsMethodError(this, args.length);

		const output = [];
		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			if (arg.type === 'literal' && typeof arg.value === 'string') {
				const variable = vars.find(vr => vr[0] === arg.value);
				if (variable) [, arg.value] = variable;
				else throw new ArgumentParseError(this.arguments[i], `The variable '${arg.value}' is not defined.`);
			}

			output[i] = await Method._validateArg(this.arguments[i], arg.value);
		}

		return output;
	}

	/**
	 * Validate an argument
	 * @param {Argument} arg The argument to parse
	 * @param {string} input The input from the user
	 * @param {boolean} [array=false] Whether this is checking an inner array or not
	 * @returns {any}
	 */
	static async _validateArg(arg, input, array = false) {
		if (!array && arg.type.endsWith('[]')) {
			if (!Array.isArray(input)) throw new IncorrectArgumentError(arg, input);
			return Promise.all(input.map(item => Method._validateArg({ ...arg, type: arg.type.slice(0, arg.type.length - 2) }, item.value, true)));
		}
		switch (arg.type) {
			case 'number': return Method._validateArgNumber(arg, input);
			case 'string': return Method._validateArgString(arg, input);
			case 'boolean': return Method._validateArgBoolean(arg, input);
			case 'buffer': return Method._validateArgBuffer(arg, input);
			case 'object': return Method._validateArgObject(arg, input);
			case 'function': return Method._validateArgFunction(arg, input);
			case 'custom': {
				if (typeof arg.custom !== 'function') throw new Error(`${arg.parent.name}::${arg.name} does not have the resolver.`);
				return arg.custom(arg, input);
			}
			default:
				throw new Error(`${arg.parent.name}::${arg.name} has an unknown type (${arg.type}), please report this to this bot's owners.`);
		}
	}

	static _validateArgFunction(arg, input) {
		if (typeof input === 'function') return input;
		throw new IncorrectArgumentError(arg, input);
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
			return await fetch(url.href)
				.then(result => result.buffer())
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
