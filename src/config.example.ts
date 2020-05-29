import { KlasaClientOptions } from 'klasa';
import { Intents, IntentsFlags } from '@klasa/ws';

// eslint-disable-next-line no-process-env
export const DEV = 'DEV' in process.env ? process.env.DEV === 'true' : !('PM2_HOME' in process.env);
export const EVLYN_PORT = 3100;

export type DeepPartial<T> = {
	[P in keyof T]?:
	T[P] extends Array<infer U> ? Array<DeepPartial<U>> :
		T[P] extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> :
			DeepPartial<T[P]>
};

export const CLIENT_OPTIONS: DeepPartial<KlasaClientOptions> = {
	commands: {
		editing: true,
		messageLifetime: 200,
		noPrefixDM: true,
		prefix: DEV ? 'ad.' : 'a.',
		prefixCaseInsensitive: true,
		regexPrefix: /alestra[,!]/i,
		slowmode: 1000,
		slowmodeAggressive: true,
		typing: true,
		prompts: { limit: 5 }
	},
	console: { useColor: true, utc: true },
	pieces: { createFolders: false },
	cache: {
		messageLifetime: 300,
		messageSweepInterval: 120,
		limits: { messages: 0 }
	},
	consoleEvents: { verbose: true },
	dev: DEV,
	ws: {
		intents: new Intents(IntentsFlags.GuildMessages),
		additionalOptions: {
			presence: { status: 'online', activity: { type: 'LISTENING', name: 'Alestra, help' } }
		}
	}
};

export const TOKEN = '';
