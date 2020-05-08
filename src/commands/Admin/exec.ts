import { ApplyOptions } from '@skyra/decorators';
import { MessageAttachment } from 'discord.js';
import { Command, CommandOptions, KlasaMessage, util } from 'klasa';
import { PermissionLevels } from '../../lib/types/Enums';
import { fetch, FetchMethods, FetchResultTypes } from '../../lib/util/util';

@ApplyOptions<CommandOptions>({
	aliases: ['execute'],
	description: 'Executes bash commands',
	guarded: true,
	permissionLevel: PermissionLevels.BotOwner,
	usage: '<expression:string>',
	flagSupport: true
})
export default class extends Command {
	public async run(message: KlasaMessage, [input]: [string]) {
		const result = await util.exec(input, { timeout: 'timeout' in message.flagArgs ? Number(message.flagArgs.timeout) : 60000 })
			.catch(error => ({ stdout: null, stderr: error }));
		const output = result.stdout ? `**\`OUTPUT\`**${util.codeBlock('prolog', result.stdout)}` : '';
		const outerr = result.stderr ? `**\`ERROR\`**${util.codeBlock('prolog', result.stderr)}` : '';
		const joined = [output, outerr].join('\n') || 'No output';

		return message.sendMessage(joined.length > 2000 ? await this.getHaste(joined).catch(() => new MessageAttachment(Buffer.from(joined), 'output.txt')) : joined);
	}

	private async getHaste(result: string) {
		const { key } = await fetch('https://hasteb.in/documents', { method: FetchMethods.Post, body: result }, FetchResultTypes.JSON) as { key: string };
		return `https://hasteb.in/${key}.js`;
	}
}
