import 'module-alias/register';
import { AlestraClient } from '@lib/AlestraClient';
import { CLIENT_OPTIONS, DEV, EVLYN_PORT, TOKEN } from '@root/config';
import { KlasaClientOptions } from 'klasa';
import { inspect } from 'util';
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
