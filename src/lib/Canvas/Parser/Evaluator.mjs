import { CANVAS_HEADER, SPLIT_METHODS, METHOD_PARSE } from '../Util/Constants.mjs';
import Method from './Method.mjs';
import CanvasConstructor from 'canvas-constructor';
import { Type } from 'klasa';

const { Canvas } = CanvasConstructor;

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
		const methods = await this.parseInput(input.slice(result[0].length, input.length));

		const canvas = new Canvas(Number(result[1]), Number(result[2]));
		for (const [method, args] of methods) canvas[method](...args);

		return canvas;
	}

	async parseInput(input) {
		const semicolon = input.indexOf(';');
		if (semicolon !== -1) input = input.slice(0, semicolon);

		const methods = input.split(SPLIT_METHODS).map(mt => mt.trim());

		const parsed = [];
		for (const method of methods) parsed.push(await this.parseMethod(method));
		return parsed;
	}

	async parseMethod(input) {
		if (!METHOD_PARSE.test(input)) throw new Error(`Expected line to be like \`.method()\`, got: ${input}`);
		const [, method, params] = METHOD_PARSE.exec(input);
		if (this.methods.has(method)) return [method, await this.methods.get(method).validate(params)];
		throw new Error(`The method ${method} is not available.`);
	}

}
