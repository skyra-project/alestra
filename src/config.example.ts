import { ClientOptions, Intents } from 'discord.js';

// eslint-disable-next-line no-process-env
export const DEV = 'DEV' in process.env ? process.env.DEV === 'true' : !('PM2_HOME' in process.env);
export const ENABLE_EVLYN = !DEV;
export const EVLYN_HOST = 'localhost';
export const EVLYN_PORT = 3100;

export const PREFIX = DEV ? 'ad.' : 'a.';

export const CLIENT_OPTIONS: ClientOptions = {
	defaultPrefix: PREFIX,
	messageCacheLifetime: 120,
	messageCacheMaxSize: 20,
	messageEditHistoryMaxSize: 0,
	presence: { status: 'online', activity: { type: 'LISTENING', name: `${PREFIX}help` } },
	ws: {
		intents: new Intents(['GUILD_MESSAGES', 'GUILDS'])
	}
};

export const OWNERS: string[] = [];
export const TOKEN = '';
