import { platform } from 'os';
import { inspect } from 'util';
import { CLIENT_OPTIONS, TOKEN } from '../config';
import { AlestraClient } from './lib/AlestraClient';
inspect.defaultOptions.depth = 1;

AlestraClient.defaultGuildSchema.add('supportChannels', 'TextChannel', { array: true });

const client = new AlestraClient(CLIENT_OPTIONS);
client.login(TOKEN).catch((error) => { client.console.error(error); });

if (!CLIENT_OPTIONS.dev) {
	client.ipc.connectTo('ny-api', platform() === 'win32' ? '//./pipe/tmp/NyAPI.sock' : '/tmp/NyAPI.sock')
		.catch((error) => { client.console.error(error); });
}
