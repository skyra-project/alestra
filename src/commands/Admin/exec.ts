import { MessageAttachment } from 'discord.js';
import { Command, CommandStore, KlasaMessage, util } from 'klasa';
import fetch from 'node-fetch';

module.exports = class extends Command {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['execute'],
			description: 'Executes bash commands',
			guarded: true,
			permissionLevel: 10,
			usage: '<expression:string>'
		});
	}

	public async run(message: KlasaMessage, [input]: [string]): Promise<KlasaMessage | KlasaMessage[]> {
		const result = await util.exec(input, { timeout: 'timeout' in message.flags ? Number(message.flags.timeout) : 60000 })
			.catch(error => ({ stdout: null, stderr: error }));
		const output = result.stdout ? `**\`OUTPUT\`**${util.codeBlock('prolog', result.stdout)}` : '';
		const outerr = result.stderr ? `**\`ERROR\`**${util.codeBlock('prolog', result.stderr)}` : '';
		const joined = [output, outerr].join('\n') || 'No output';

		return message.sendMessage(joined.length > 2000 ? await this.upload(joined) : joined);
	}

	public async upload(result: string): Promise<string | MessageAttachment> {
		const response = await fetch('https://hastebin.com/documents', { method: 'JSON', body: result });
		if (response.ok) return `https://hastebin.com/${(await response.json()).key}.js`;
		return new MessageAttachment(Buffer.from(result), 'output.txt');
	}

};
