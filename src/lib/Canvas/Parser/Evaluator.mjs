import { CANVAS_HEADER, SPLIT_METHODS, METHOD_PARSE } from '../Util/Constants.mjs';
import { MethodParseError } from '../Util/ValidateError.mjs';
import Method from './Method.mjs';
import { SIZES } from '../../../../config';
import { Canvas } from 'canvas-constructor';
import { Type } from 'klasa';

export default class Evaluator {

	constructor() {
		this.methods = new Map();
	}

	add(method) {
		if (!(method instanceof Method)) throw new TypeError(`Expected an instance of Method, got ${new Type(method)}`);
		this.methods.set(method.name, method);

		return this;
	}

	async parse(input) {
		if (!CANVAS_HEADER.test(input)) throw new Error(`You must initialize Canvas with \`new Canvas(width, height)\`.`);
		const result = CANVAS_HEADER.exec(input);

		const width = Number(result[1]), height = Number(result[2]);
		if (width > SIZES.WIDTH) throw new Error(`Canvas width must be a value lower than ${SIZES.WIDTH}. Got: ${width}`);
		if (height > SIZES.HEIGHT) throw new Error(`Canvas height must be a value lower than ${SIZES.HEIGHT}. Got: ${height}`);

		const methods = await this.parseInput(input.slice(result[0].length, input.length));

		const canvas = new Canvas(Number(result[1]), Number(result[2]));
		let breakChain = null;
		for (const [method, args] of methods) {
			if (breakChain) throw new MethodParseError(`The CanvasConstructor.prototype.${breakChain} call was not chainable.`);
			if (typeof canvas[method] === 'function') {
				if (canvas[method](...args) !== canvas) breakChain = method;
			} else {
				throw new MethodParseError(`CanvasConstructor.prototype.${method} is not a function.`);
			}
		}

		return canvas;
	}

	async parseInput(input) {
		const semicolon = input.indexOf(';');
		if (semicolon !== -1) input = input.slice(0, semicolon);
		input = input.trim();

		if (!input.length) return [];
		const methods = input.split(SPLIT_METHODS).map(mt => mt.trim());

		const parsed = [];
		for (const method of methods) parsed.push(await this.parseMethod(method));
		return parsed;
	}

	async parseMethod(input) {
		if (!METHOD_PARSE.test(input)) throw new Error(`Expected line to be like \`.method()\`, got: ${input}`);
		const [, method, params] = METHOD_PARSE.exec(input);
		if (!(method in Canvas.prototype)) throw new MethodParseError(`The method ${method} does not exist.`);
		if (this.methods.has(method)) return [method, await this.methods.get(method).validate(params)];
		throw new MethodParseError(`The method ${method} is blocked.`);
	}

}
