import 'module-alias/register';
import { inspect } from 'util';
import { CLIENT_OPTIONS, TOKEN, EVLYN_PORT, DEV } from './config';
import { AlestraClient } from './lib/AlestraClient';
import { KlasaClientOptions } from 'klasa';
inspect.defaultOptions.depth = 1;

AlestraClient.defaultGuildSchema.add('supportChannels', 'TextChannel', { array: true });

const client = new AlestraClient(CLIENT_OPTIONS as KlasaClientOptions);
client.token = TOKEN;

client.connect().catch((error) => {
	client.console.error(error);
});

if (!DEV) {
	client.ipc.connectTo(EVLYN_PORT).catch((error) => {
		client.console.error(error);
	});
}

declare module 'klasa' {
	export interface PieceOptions {}
}
