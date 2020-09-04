import { Client, PresenceBuilder } from '@klasa/core';
import { ActivityType } from '@klasa/dapi-types';
import { Intents, IntentsFlags } from '@klasa/ws';
import { DeepPartial } from '@sapphire/utilities';
import { KlasaClientOptions } from 'klasa';

export const DEV = Reflect.has(process.env, 'DEV') ? process.env.DEV === 'true' : !('PM2_HOME' in process.env);
export const EVLYN_PORT = 3100;
export const EVLYN_HOST = 'http://evelyn';
export const PREFIX = DEV ? 'ad.' : 'a.';

export const CLIENT_OPTIONS: DeepPartial<KlasaClientOptions> = {
	commands: {
		editing: true,
		logging: true,
		messageLifetime: 200,
		prefix: PREFIX,
		prefixCaseInsensitive: true,
		slowmode: 1000,
		slowmodeAggressive: true,
		typing: true,
		prompts: { limit: 5 },
		noPrefixDM: true
	},
	console: { useColor: true, utc: true },
	pieces: { createFolders: false },
	cache: { limits: { messages: 20 } },
	consoleEvents: { verbose: true },
	owners: [''],
	readyMessage: (client: Client) =>
		`Alestra v4.0.0 ready! [${client.user!.tag}] [ ${client.guilds.size} [G]] [ ${client.guilds
			.reduce((a, b) => a + (b.memberCount ?? 0), 0)
			.toLocaleString()} [U]].`,
	ws: {
		intents: new Intents([IntentsFlags.GuildMessages, IntentsFlags.Guilds]),
		additionalOptions: {
			presence: new PresenceBuilder().setGame((pg) => pg.setType(ActivityType.Listening).setName(`a${DEV ? 'd' : ''}.help`))
		}
	}
};

export const TOKEN = '';
