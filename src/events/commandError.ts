import { CommandErrorPayload, Event, Events, UserError } from '@sapphire/framework';

export class UserEvent extends Event<Events.CommandError> {
	public run(error: Error, { message, command }: CommandErrorPayload) {
		if (typeof error === 'string') return message.send(error);
		if (error instanceof UserError && error.message) return message.send(error.message);
		this.context.logger.error(`Error in command ${command.name} [${command.path}]: `, error);
	}
}
