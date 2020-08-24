import { Command, CommandOptions } from 'klasa';
import { exec, codeBlock } from '@klasa/utils';
import { Attachment, Message } from '@klasa/core';
import { ApplyOptions } from '@skyra/decorators';
import { fetch, FetchMethods, FetchResultTypes } from '../../lib/util/util';

@ApplyOptions<CommandOptions>({
	aliases: ['execute'],
	description: (language) => language.get('COMMAND_EXEC_DESCRIPTION'),
	extendedHelp: (language) => language.get('COMMAND_EXEC_EXTENDED'),
	guarded: true,
	permissionLevel: 10,
	usage: '<expression:string>',
	flagSupport: true
})
export default class extends Command {
	public async run(message: Message, [input]: [string]) {
		const result = await exec(input, { timeout: 'timeout' in message.flagArgs ? Number(message.flagArgs.timeout) : 60000 }).catch((error) => ({
			stdout: null,
			stderr: error as Error
		}));
		const output = result.stdout ? `**\`OUTPUT\`**${codeBlock('prolog', result.stdout)}` : '';
		const outerr = result.stderr ? `**\`ERROR\`**${codeBlock('prolog', result.stderr)}` : '';
		const joined = [output, outerr].join('\n') || 'No output';

		return message.reply((mb) =>
			joined.length <= 2000
				? mb.setContent(joined)
				: this.getHaste(joined)
						.then((url) => mb.setContent(url))
						.catch(async () => mb.addFile(await new Attachment().setName('output.txt').setFile(Buffer.from(joined)).resolve()))
		);
	}

	private async getHaste(result: string) {
		const { key } = (await fetch('https://hasteb.in/documents', { method: FetchMethods.Post, body: result }, FetchResultTypes.JSON)) as {
			key: string;
		};
		return `https://hasteb.in/${key}.js`;
	}
}
