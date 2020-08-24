import { ChannelType } from '@klasa/dapi-types';
import { PermissionLevels } from '@lib/types/Enums';
import { Command, CommandOptions, CommandStore, KlasaMessage } from 'klasa';

export abstract class AlestraCommand extends Command {
	public constructor(store: CommandStore, directory: string, file: string[], options: AlestraCommandOptions = {}) {
		super(store, directory, file, {
			runIn: [ChannelType.GuildText, ChannelType.GuildNews, ChannelType.GuildStore],
			permissionLevel: PermissionLevels.Everyone,
			deletable: true,
			quotedStringSupport: true,
			autoAliases: true,
			...options
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
	public run(message: KlasaMessage, _params: any[]): any {
		return message;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public inhibit(_message: KlasaMessage): Promise<boolean> | boolean {
		return false;
	}
}

export type AlestraCommandOptions = CommandOptions;
