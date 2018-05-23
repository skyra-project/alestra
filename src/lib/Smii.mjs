import { KlasaClient } from 'klasa';
import Evaluator from './Canvas/Parser/Evaluator.mjs';
import init from './Canvas/Data/Init.mjs';

export default class Smii extends KlasaClient {

	constructor(options) {
		super(options);

		this.evaluator = new Evaluator();
		init(this.evaluator);
	}

}
