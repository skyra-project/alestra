import { AlestraClient } from '#lib/AlestraClient';
import { CLIENT_OPTIONS } from '#root/config';
import { inspect } from 'util';

import '@sapphire/plugin-editable-commands/register';

inspect.defaultOptions.depth = 1;

const client = new AlestraClient(CLIENT_OPTIONS);
client.login().catch((error) => {
	client.logger.error(error);
});
