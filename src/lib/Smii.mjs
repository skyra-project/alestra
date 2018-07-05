import { KlasaClient, util } from 'klasa';
import Evaluator from './Canvas/Parser/Evaluator.mjs';
import init from './Canvas/Data/Init.mjs';

export default class Smii extends KlasaClient {

	constructor(options) {
		super(util.mergeDefault({ dev: false }, options));

		this.evaluator = new Evaluator();
		init(this.evaluator);

		this.once('klasaReady', () => {
			if (this.options.dev) this.permissionLevels.add(0, (client, message) => message.author.id === client.options.ownerID, { break: true });
		});
	}

}
