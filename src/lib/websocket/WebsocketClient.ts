/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { AlestraClient } from '#lib/AlestraClient';
import { EVLYN_HOST, EVLYN_PORT } from '#root/config';
import { red, yellow } from 'colorette';
import { ClientNames, MessageFromClient, MessageFromClientAction, MessageFromServer, MessageFromServerAction } from './types';
import WebSocket = require('ws');

const y = yellow('[STAT-WS ]');
const r = red('[STAT-WS ]');

export class WebsocketClient {
	#ws = new WebSocket(`ws://${EVLYN_HOST}:${EVLYN_PORT}`, { headers: { authorization: ClientNames.Alestra } });
	#client: AlestraClient;

	public constructor(client: AlestraClient) {
		this.#client = client;

		this.#ws.onerror = (event) => {
			this.#client.logger.error(`${r} Error from ${ClientNames.Evlyn}`, event.error);
		};

		this.#ws.onclose = (event) => {
			this.#client.logger.warn(`${y} Closed with code ${event.code}\n with reason ${event.reason}`);
		};

		this.#ws.onmessage = (event) => {
			const { action } = JSON.parse(event.data as any) as MessageFromServer;

			switch (action) {
				case MessageFromServerAction.Ping: {
					this.#client.logger.debug('Received a ping');
					const memoryUsage = process.memoryUsage();
					const shard = this.#client.ws.shards.first()!;
					this.sendJSON({
						action: MessageFromClientAction.HeartBeat,
						data: {
							name: ClientNames.Alestra,
							heapTotal: memoryUsage.heapTotal,
							heapUsed: memoryUsage.heapUsed,
							ping: shard.ping,
							status: shard.status
						}
					});
					break;
				}
			}
		};
	}

	private sendJSON(data: MessageFromClient) {
		this.#ws.send(JSON.stringify(data));
	}
}
