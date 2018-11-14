import { CLIENT_OPTIONS, TOKEN } from '../config';
import Alestra from './lib/Alestra';

Alestra.defaultGuildSchema.add('supportChannels', 'TextChannel', { array: true });

const client = new Alestra(CLIENT_OPTIONS);
client.login(TOKEN).catch((error) => { client.console.error(error); });
