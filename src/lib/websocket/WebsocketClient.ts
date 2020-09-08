/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { Colors } from '@klasa/console';
import { PresenceUpdateStatus } from '@klasa/dapi-types';
import { WebSocketShardStatus as KlasaWsStatus } from '@klasa/ws';
import { AlestraClient } from '@lib/AlestraClient';
import { EVLYN_HOST, EVLYN_PORT } from '@root/config';
import { DeepPartial } from '@sapphire/utilities';
import { ClientNames, MessageFromClient, MessageFromClientAction, MessageFromServer, MessageFromServerAction, WebsocketStatus } from './types';
import WebSocket = require('ws');

const y = new Colors({ text: 'yellow' }).format('[STAT-WS ]');
const r = new Colors({ text: 'red' }).format('[STAT-WS ]');

export class WebsocketClient {
	#ws = new WebSocket(`ws://${EVLYN_HOST}:${EVLYN_PORT}`, { headers: { authorization: ClientNames.Alestra } });
	#client: AlestraClient;

	public constructor(client: AlestraClient) {
		this.#client = client;

		this.#ws.onerror = (event) => {
			this.#client.console.error(`${r} Error from ${ClientNames.Evlyn}`, event.error);
		};

		this.#ws.onclose = (event) => {
			this.#client.console.warn(`${y} Closed with code ${event.code}\n with reason ${event.reason}`);
		};

		this.#ws.onmessage = (event) => {
			const { action } = JSON.parse(event.data as any) as MessageFromServer;

			switch (action) {
				case MessageFromServerAction.Ping: {
					this.#client.console.log('Received a ping');
					const memoryUsage = process.memoryUsage();
					this.sendJSON({
						action: MessageFromClientAction.HeartBeat,
						data: {
							name: ClientNames.Alestra,
							heapTotal: memoryUsage.heapTotal,
							heapUsed: memoryUsage.heapUsed,
							ping: this.#client.ws.shards.firstValue!.ping,
							status: WebsocketClient.KlasaWsStatusTransformer[this.#client.ws.shards.firstValue!.status],
							presence: this.#client.user!.presence.status ?? PresenceUpdateStatus.Offline
						}
					});
					break;
				}
			}
		};
	}

	private sendJSON(data: DeepPartial<MessageFromClient>) {
		this.#ws.send(JSON.stringify(data));
	}

	public static KlasaWsStatusTransformer: Record<KlasaWsStatus, WebsocketStatus> = {
		[KlasaWsStatus.Connected]: WebsocketStatus.Connected,
		[KlasaWsStatus.Connecting]: WebsocketStatus.Connecting,
		[KlasaWsStatus.Reconnecting]: WebsocketStatus.Reconnecting,
		[KlasaWsStatus.Disconnected]: WebsocketStatus.Disconnected,
		[KlasaWsStatus.Resuming]: WebsocketStatus.Resuming
	};
}
