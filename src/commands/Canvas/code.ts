import { ApplyOptions } from '@skyra/decorators';
import { Canvas } from 'canvas-constructor';
import { Command, CommandOptions } from 'klasa';
import { ScriptTarget, transpileModule, TranspileOptions } from 'typescript';
import { inspect } from 'util';
import { evaluate } from '../../lib/Canvas/Parser/Evaluator';
import { Message, Attachment, Permissions } from '@klasa/core';
import { Stopwatch } from '@klasa/stopwatch';
import { codeBlock } from '@klasa/utils';

const tsTranspileOptions: TranspileOptions = { compilerOptions: { allowJs: true, checkJs: true, target: ScriptTarget.ESNext } };

const CODEBLOCK = /^```(?:js|javascript)?([\s\S]+)```$/;

@ApplyOptions<CommandOptions>({
	bucket: 1,
	cooldown: 5,
	description: 'Execute a sandboxed subset of JavaScript',
	requiredPermissions: [Permissions.FLAGS.ATTACH_FILES],
	runIn: [0],
	usage: '<code:string>',
	flagSupport: true
})
export default class extends Command {
	public async run(message: Message, [code]: [string]) {
		code = this.parseCodeblock(code);
		const sw = new Stopwatch(5);
		try {
			let output = await evaluate(message.flagArgs.ts ? transpileModule(code, tsTranspileOptions).outputText : code, [
				['message', this.createMessageMock(message)],
				['client', this.createClientMock()]
			]);
			sw.stop();
			if (output instanceof Canvas) output = await output.toBufferAsync();
			if (output instanceof Buffer) {
				// output, 'output.png',
				return message.reply(async (mb) =>
					mb.setContent(`\`✔\` \`⏱ ${sw}\``).addFile(
						await new Attachment()
							.setName('output.png')
							.setFile(output as Buffer)
							.resolve()
					)
				);
			}

			return message.reply((mb) => mb.setContent(`\`✔\` \`⏱ ${sw}\`\n${codeBlock('js', inspect(output, false, 0, false))}`));
		} catch (error) {
			if (sw.running) sw.stop();
			throw `\`❌\` \`⏱ ${sw}\`\n${codeBlock(
				'',
				'stack' in message.flags && this.client.options.owners.includes(message.author!.id) ? (error as Error).stack : error
			)}`;
		}
	}

	public parseCodeblock(code: string): string {
		return CODEBLOCK.test(code) ? CODEBLOCK.exec(code)![1].trim() : code;
	}

	private createMessageMock(message: Message) {
		const author = Object.freeze({
			id: message.author.id,
			avatar: message.author.avatar,
			avatarURL: message.author.avatarURL.bind(message.author),
			displayAvatarURL: message.author.displayAvatarURL.bind(message.author),
			username: message.author.username,
			discriminator: message.author.discriminator,
			bot: message.author.bot
		});

		const member = message.member
			? Object.freeze({
					id: message.author.id,
					user: author,
					nick: message.member.nick
			  })
			: null;

		const guild = message.guild
			? Object.freeze({
					id: message.guild.id,
					name: message.guild.name,
					icon: message.guild.icon
			  })
			: null;

		return Object.freeze({
			id: message.id,
			content: message.content,
			author,
			member,
			guild
		});
	}

	private createClientMock() {
		const clientUser = this.client.user;
		const user = clientUser
			? Object.freeze({
					id: clientUser.id,
					avatar: clientUser.avatar,
					avatarURL: clientUser.avatarURL.bind(clientUser),
					displayAvatarURL: clientUser.displayAvatarURL.bind(clientUser),
					username: clientUser.username,
					discriminator: clientUser.discriminator,
					bot: clientUser.bot
			  })
			: null;

		return Object.freeze({
			user
		});
	}
}
