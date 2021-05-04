import { Event, Events } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class UserEvent extends Event<Events.MessageUpdate> {
	public run(_: Message, message: Message) {
		this.context.client.emit(Events.Message, message);
	}
}
