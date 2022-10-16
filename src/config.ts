import { ActivityOptions, ClientOptions, ExcludeEnum, Intents } from 'discord.js';
import { envIsDefined, envParseArray, envParseString, setup } from '@skyra/env-utilities';
import { getRootData } from '@sapphire/pieces';
import { join } from 'node:path';
import type { ActivityTypes } from 'discord.js/typings/enums';

export const ROOT_FOLDER = join(getRootData().root, '..');
setup(join(ROOT_FOLDER, 'src', '.env'));

export const DEV = envParseString('NODE_ENV') !== 'production';

export const OWNERS = envParseArray('CLIENT_OWNERS');
export const PREFIX = envParseString('CLIENT_PREFIX');
export const VERSION = envParseString('CLIENT_VERSION');

const parsePresenceActivity = (): ActivityOptions[] => {
	if (!envIsDefined('CLIENT_PRESENCE_NAME')) return [];

	return [
		{
			name: envParseString('CLIENT_PRESENCE_NAME'),
			type: envParseString('CLIENT_PRESENCE_TYPE', 'LISTENING') as ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>
		}
	];
};

export const CLIENT_OPTIONS: ClientOptions = {
	defaultPrefix: PREFIX,
	loadDefaultErrorListeners: false,
	presence: { status: 'online', activities: parsePresenceActivity() },
	intents: new Intents(['GUILD_MESSAGES', 'GUILDS'])
};
