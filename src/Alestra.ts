import { inspect } from 'util';
import { CLIENT_OPTIONS, TOKEN } from '../config';
import { AlestraClient } from './lib/AlestraClient';
inspect.defaultOptions.depth = 1;

AlestraClient.defaultGuildSchema.add('supportChannels', 'TextChannel', { array: true });

const client = new AlestraClient(CLIENT_OPTIONS);
client.login(TOKEN).catch(error => {
	client.console.error(error);
});

if (!CLIENT_OPTIONS.dev) {
	client.ipc.connectTo(9997).catch(error => {
		client.console.error(error);
	});
}
