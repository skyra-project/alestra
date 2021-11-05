import { ClientOptions, Intents } from 'discord.js';

// eslint-disable-next-line no-process-env
export const DEV = 'DEV' in process.env ? process.env.DEV === 'true' : !('PM2_HOME' in process.env);
export const ENABLE_EVLYN = !DEV;
export const EVLYN_HOST = 'localhost';
export const EVLYN_PORT = 3100;

export const OWNERS: string[] = ['242043489611808769'];
export const PREFIX = DEV ? 'ad.' : 'a.';
export const VERSION = 'v5.0.0';

export const CLIENT_OPTIONS: ClientOptions = {
	defaultPrefix: PREFIX,
	loadDefaultErrorListeners: false,
	presence: { status: 'online', activities: [{ type: 'LISTENING', name: `${PREFIX}help` }] },
	intents: new Intents(['GUILD_MESSAGES', 'GUILDS'])
};

export const TOKEN = '';
