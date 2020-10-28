import { Stopwatch } from '@klasa/stopwatch';
import { evaluate } from '@lib/Canvas/Parser/Evaluator';
import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { codeBlock } from '@sapphire/utilities';
import { Canvas } from 'canvas-constructor';
import { Message, MessageAttachment } from 'discord.js';
import { inspect } from 'util';

const CODEBLOCK = /^```(?:js|javascript)?([\s\S]+)```$/;

@ApplyOptions<CommandOptions>({
	description: 'Execute a sandboxed subset of JavaScript'
})
export default class UserCommand extends Command {
	public async run(message: Message, args: Args) {
		const code = this.parseCodeblock(await args.rest('string'));
		const sw = new Stopwatch(5);
		try {
			let output = await evaluate(code, [
				['message', this.createMessageMock(message)],
				['client', this.createClientMock()]
			]);
			sw.stop();
			if (output instanceof Canvas) output = await output.toBufferAsync();
			if (output instanceof Buffer) {
				// output, 'output.png',
				const attachment = new MessageAttachment(output, 'output.png');
				return message.channel.send(`\`✔\` \`⏱ ${sw}\``, attachment);
			}

			return message.channel.send(`\`✔\` \`⏱ ${sw}\`\n${codeBlock('js', inspect(output, false, 0, false))}`);
		} catch (error) {
			if (sw.running) sw.stop();
			throw `\`❌\` \`⏱ ${sw}\`\n${codeBlock('', error)}`;
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
					nick: message.member.nickname
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
