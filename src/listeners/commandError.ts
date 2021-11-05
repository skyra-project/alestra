import { CommandErrorPayload, Listener, UserError } from '@sapphire/framework';
import { send } from '@skyra/editable-commands';

export class UserEvent extends Listener<'commandError'> {
	public run(error: Error, { message, command }: CommandErrorPayload) {
		if (typeof error === 'string') return send(message, error);
		if (error instanceof UserError && error.message) return send(message, error.message);
		return this.container.logger.error(`Error in command ${command.name} [${command.location.full}]: `, error);
	}
}
