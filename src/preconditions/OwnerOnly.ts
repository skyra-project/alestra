import { OWNERS } from '@root/config';
import { Precondition, PreconditionResult } from '@sapphire/framework';
import { Message } from 'discord.js';

export class UserPrecondition extends Precondition {
	public run(message: Message): PreconditionResult {
		return OWNERS.includes(message.author.id) ? this.ok() : this.error({ message: 'This command is reserved for bot owners.' });
	}
}
