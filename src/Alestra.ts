import 'module-alias/register';
import 'reflect-metadata';
import { AlestraClient } from '@lib/AlestraClient';
import { CLIENT_OPTIONS, TOKEN } from '@root/config';
import { inspect } from 'util';
import * as colorette from 'colorette';

inspect.defaultOptions.depth = 1;
colorette.options.enabled = true;

const client = new AlestraClient(CLIENT_OPTIONS);
client.login(TOKEN).catch((error) => {
	client.logger.error(error);
});
