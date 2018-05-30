import { CANVAS_HEADER } from '../Util/Constants.mjs';
import { MethodParseError } from '../Util/ValidateError.mjs';
import Method from './Method.mjs';
import { SIZES } from '../../../../config';
import { Canvas } from 'canvas-constructor';
import { Type } from 'klasa';
import StreamLine from './StreamLine.mjs';

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

		let breakChain = null;
		const canvas = new Canvas(Number(result[1]), Number(result[2]));
		for (const [method, args] of new StreamLine(input.slice(result[0].length, input.length)).run()) {
			if (breakChain)
				throw new MethodParseError(`The CanvasConstructor.prototype.${breakChain} call was not chainable.`);

			if (typeof canvas[method] !== 'function')
				throw new MethodParseError(`The method ${method} does not exist.`);

			if (this.methods.has(method)) {
				if (canvas[method](...await this.methods.get(method).validate(args)) !== canvas) breakChain = method;
			} else {
				throw new MethodParseError(`The method ${method} is blocked.`);
			}
		}

		return canvas;
	}

}
