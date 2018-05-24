import { TOKEN } from '../config.mjs';
import { Smii } from './index';

new Smii({
	commandEditing: true,
	commandLogging: false,
	commandMessageLifetime: 200,
	consoleEvents: { verbose: true },
	customPromptDefaults: { limit: 5 },
	messageCacheLifetime: 200,
	messageCacheMaxSize: 25,
	messageSweepInterval: 100,
	prefix: 's.',
	presence: { status: 'online', activity: { type: 'LISTENING', name: 'Smii, help' } },
	regexPrefix: /smii(,|!)/i,
	typing: true
}).login(TOKEN);
