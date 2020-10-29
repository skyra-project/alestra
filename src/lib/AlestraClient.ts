import { WebsocketClient } from '@lib/websocket/WebsocketClient';
import { ENABLE_EVLYN } from '@root/config';
import { SapphireClient } from '@sapphire/framework';

export class AlestraClient extends SapphireClient {
	public websocket = ENABLE_EVLYN ? new WebsocketClient(this) : null;
}
