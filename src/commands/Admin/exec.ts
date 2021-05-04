import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { codeBlock } from '@sapphire/utilities';
import { exec } from '@utils/exec';
import { fetch, FetchMethods, FetchResultTypes } from '@utils/util';
import { Message, MessageAttachment } from 'discord.js';

@ApplyOptions<CommandOptions>({
	aliases: ['execute'],
	description: 'Executes a Bash command.',
	preconditions: ['OwnerOnly'],
	strategyOptions: { options: ['timeout'] }
})
export default class UserCommand extends Command {
	public async run(message: Message, args: Args) {
		// Get input and timeout option:
		const input = await args.rest('string');
		const timeout = args.getOption('timeout');

		// Execute the command:
		const result = await exec(input, { timeout: timeout ? Number(timeout) : 60000 }).catch((error) => ({
			stdout: null,
			stderr: error as Error
		}));
		const output = result.stdout ? `**\`OUTPUT\`**${codeBlock('prolog', result.stdout)}` : '';
		const outerr = result.stderr ? `**\`ERROR\`**${codeBlock('prolog', result.stderr)}` : '';
		const joined = [output, outerr].join('\n') || 'No output';

		return message.send(
			joined.length > 2000 ? await this.getHaste(joined).catch(() => new MessageAttachment(Buffer.from(joined), 'output.txt')) : joined
		);
	}

	private async getHaste(result: string) {
		const { key } = (await fetch('https://hasteb.in/documents', { method: FetchMethods.Post, body: result }, FetchResultTypes.JSON)) as {
			key: string;
		};
		return `https://hasteb.in/${key}.js`;
	}
}
