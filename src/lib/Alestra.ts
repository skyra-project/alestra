import { KlasaClient, KlasaClientOptions, util } from 'klasa';
import Evaluator from './Canvas/Parser/Evaluator';

export default class Alestra extends KlasaClient {

	public evaluator = new Evaluator();
	public options: Required<AlestraClientOptions>;

	public constructor(options: AlestraClientOptions) {
		super(util.mergeDefault({ dev: false }, options));

		this.once('klasaReady', () => {
			if (this.options.dev) this.permissionLevels.add(0, (client, message) => message.author.id === client.options.ownerID, { break: true });
		});
	}

}

export type AlestraClientOptions = KlasaClientOptions & { dev?: boolean };
