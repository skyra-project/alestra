import { AlestraClient } from '#lib/AlestraClient';
import { CLIENT_OPTIONS } from '#root/config';
import { inspect } from 'util';

import '@sapphire/plugin-editable-commands/register';
import { envParseString } from '@skyra/env-utilities';

inspect.defaultOptions.depth = 1;

const client = new AlestraClient(CLIENT_OPTIONS);
client.login(envParseString('CLIENT_TOKEN')).catch((error) => {
	client.logger.error(error);
});
