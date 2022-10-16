import { evaluate } from '#lib/Canvas/Parser/Evaluator';
import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { Stopwatch } from '@sapphire/stopwatch';
import { codeBlock } from '@sapphire/utilities';
import { send } from '@skyra/editable-commands';
import { Canvas } from 'canvas-constructor/napi-rs';
import { GuildMember, ImageURLOptions, Message, MessageAttachment, User } from 'discord.js';
import { inspect } from 'util';

const CODEBLOCK = /^```(?:js|javascript)?([\s\S]+)```$/;

@ApplyOptions<CommandOptions>({
	description: 'Execute a sandboxed subset of JavaScript.',
	quotes: []
})
export class UserCommand extends Command {
	public async messageRun(message: Message, args: Args) {
		const code = this.parseCodeblock(await args.rest('string'));
		const sw = new Stopwatch(5);
		try {
			let output = await evaluate(code, [
				['message', this.createMessageMock(message)],
				['client', this.createClientMock()]
			]);
			sw.stop();
			if (output instanceof Canvas) output = await output.png();
			if (output instanceof Buffer) {
				// output, 'output.png',
				const attachment = new MessageAttachment(output, 'output.png');
				return send(message, { content: `\`✔\` \`⏱ ${sw}\``, files: [attachment] });
			}

			return send(message, `\`✔\` \`⏱ ${sw}\`\n${codeBlock('js', inspect(output, false, 0, false))}`);
		} catch (error) {
			if (sw.running) sw.stop();
			throw `\`❌\` \`⏱ ${sw}\`\n${codeBlock('', error)}`;
		}
	}

	public parseCodeblock(code: string): string {
		return CODEBLOCK.test(code) ? CODEBLOCK.exec(code)![1].trim() : code;
	}

	private createMessageMock(message: Message) {
		const author = Object.freeze(this.createUserMock(message.author));
		const member = message.member ? Object.freeze(this.createGuildMemberMock(message.member, message.author)) : null;

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

	private createUserMock(user: User) {
		return {
			accentColor: user.accentColor,
			avatar: user.avatar,
			banner: user.banner,
			bot: user.bot,
			discriminator: user.discriminator,
			id: user.id,
			system: user.system,
			username: user.username,
			get createdAt() {
				return user.createdAt;
			},
			get createdTimestamp() {
				return user.createdTimestamp;
			},
			get defaultAvatarURL() {
				return user.defaultAvatarURL;
			},
			get tag() {
				return user.tag;
			},
			avatarURL(options?: ImageURLOptions) {
				return user.avatarURL(options);
			},
			bannerURL(options?: ImageURLOptions) {
				return user.bannerURL(options);
			},
			displayAvatarURL(options?: ImageURLOptions) {
				return user.displayAvatarURL(options);
			},
			toString() {
				return user.toString();
			}
		};
	}

	private createGuildMemberMock(member: GuildMember, user: User) {
		return {
			id: user.id,
			user,
			nickname: member.nickname,
			joinedTimestamp: member.joinedTimestamp,
			get displayColor() {
				return member.displayColor;
			},
			get displayHexColor() {
				return member.displayHexColor;
			},
			get displayName() {
				return member.displayName;
			},
			get joinedAt() {
				return member.joinedAt;
			},
			toString() {
				return member.toString();
			},
			valueOf() {
				return member.valueOf();
			}
		};
	}

	private createClientMock() {
		const clientUser = this.container.client.user;
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
