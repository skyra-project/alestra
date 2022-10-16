import { WebsocketClient } from '#lib/websocket/WebsocketClient';
import { SapphireClient } from '@sapphire/framework';

export class AlestraClient extends SapphireClient {
	public websocket = new WebsocketClient(this);
}
