import { CLIENT_OPTIONS, TOKEN } from '../config.mjs';
import { Smii } from './index';

Smii.defaultGuildSchema.add('supportChannels', 'TextChannel', { array: true });

new Smii(CLIENT_OPTIONS).login(TOKEN);
