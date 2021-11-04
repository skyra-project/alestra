import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
	aliases: ['pong'],
	description: 'Runs a connection test with Discord'
})
export class UserCommand extends Command {
	public async messageRun(message: Message) {
		const msg = await send(message, 'Ping...');

		const roundtrip = (msg.editedTimestamp || msg.createdTimestamp) - (message.editedTimestamp || message.createdTimestamp);
		const heartbeat = Math.round(this.container.client.ws.ping);
		const content = `Pong! (Roundtrip took: ${roundtrip}ms. Heartbeat: ${heartbeat}ms).`;
		return send(message, content);
	}
}
