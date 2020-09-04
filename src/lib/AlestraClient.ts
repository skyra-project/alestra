import { WebsocketClient } from '@lib/websocket/WebsocketClient';
import { DEV } from '@root/config';
import { KlasaClient, KlasaClientOptions } from 'klasa';

export class AlestraClient extends KlasaClient {
	// eslint-disable-next-line @typescript-eslint/no-invalid-this
	public websocket = new WebsocketClient(this);
	public dev = DEV;

	public constructor(options: Partial<KlasaClientOptions> = {}) {
		super(options);
	}
}
