import { GuildChannel, MessageEmbed, Permissions, Snowflake } from 'discord.js';
import { KlasaMessage, Monitor as KlasaMonitor, MonitorStore, ReactionHandler, RichDisplay, util } from 'klasa';
import {
	checkErrors,
	CODEBLOCK_REGEXP
} from '../lib/Linter/Linter';

const { FLAGS } = Permissions;

export default class Monitor extends KlasaMonitor {

	public handlers: Map<string, { handler: ReactionHandler; message: KlasaMessage }> = new Map();
	public dev: boolean = this.client.options.dev;
	private readonly kCanvasConstructorEmoji = '<:canvasconstructor:451438332375728128>';

	public constructor(store: MonitorStore, file: string[], directory: string) {
		super(store, file, directory, {
			ignoreOthers: false,
			ignoreEdits: false
		});
	}

	public async run(message: KlasaMessage): Promise<void> {
		// If it's in development mode, ignore anyone else that is not the owner
		if (this.dev && this.client.options.owners.includes(message.author!.id)) return;
		// If it's not in a guild, return
		if (!message.guild) return;
		// If this is not a support channel, return
		if (!(message.guild.settings.get('supportChannels') as Snowflake[]).includes(message.channel.id)) return;
		// If I don't have permissions, return
		if (!(message.channel as GuildChannel).permissionsFor(message.guild!.me!)!.has(FLAGS.MANAGE_MESSAGES)) return;
		// If there is no codeblock, return
		if (!CODEBLOCK_REGEXP.test(message.content)) return;

		const oldHandler = this.handlers.get(message.author!.id);
		if (oldHandler) {
			oldHandler.handler.stop();
		}

		const code = CODEBLOCK_REGEXP.exec(message.content)![1].trim();
		const errors = checkErrors(code);
		if (!errors.length) {
			if (message.reactions.has('451517251464593411')) await message.reactions.removeAll();
			await message.react('greenTick:451517251317923851');
			return;
		}

		if (message.reactions.has('451517251317923851')) await message.reactions.removeAll();

		if (!oldHandler || oldHandler.message !== message) {
			await message.react('redCross:451517251464593411');
			await message.react('🔍');
			const reactions = await message.awaitReactions((reaction, user) => user.id === message.author!.id && reaction.emoji.name === '🔍', { time: 15000, max: 1 });
			if (message.deleted) return;
			if (reactions.size) {
				const reaction = message.reactions.get('🔍');
				if (reaction) await reaction.users.remove(message.author!).catch(() => null);
			} else {
				const reaction = message.reactions.get('🔍');
				if (reaction) await reaction.users.remove(this.client.user!).catch(() => null);
			}
		}

		const richDisplay = new RichDisplay(new MessageEmbed()
			.setColor(0xFF7327)
			// @ts-ignore
			.setAuthor(this.client.user.username, this.client.user.avatarURL({ size: 64 }))
			.setTitle('ESLint Errors'));

		for (const error of errors) {
			richDisplay.addPage(template => template.setDescription([
				`[\`${error.ruleId || 'Parsing Error'}\`] (Severity ${error.severity}) at ${
					this._displayRanges(error.line, error.endLine || 0)}:${
					this._displayRanges(error.column, error.endColumn || 0)
				}\n\`\`${error.message}\`\`${this._displayText(code, error.line, error.endLine, error.column, error.endColumn)}`
			].join('\n')));
		}
		const handler = await richDisplay.run(
			// @ts-ignore
			await message.channel.send(`${this.kCanvasConstructorEmoji} | Please wait...`),
			{ filter: (_, user) => user.id === message.author!.id, time: 120000 }
		);

		this.handlers.set(message.author!.id, { handler, message });
		handler.once('end', () => {
			this.handlers.delete(message.author!.id);
			if (!handler.message.deleted) handler.message.delete().catch(() => null);
			if (!message.deleted) {
				const reaction = message.reactions.get('🔍');
				if (reaction && reaction.users.has(this.client.user!.id)) reaction.users.remove(this.client.user!).catch(() => null);
			}
		});
	}

	public _displayRanges(start: number, end: number): string {
		if (typeof end !== 'number') return String(start);
		if (start === end) return String(start);
		return `${start}-${end}`;
	}

	public _displayText(code: string, line: number, endLine: number = line, column: number, endColumn: number = column): string {
		const singleLine = typeof endLine !== 'number' || line === endLine;
		if (singleLine) {
			const extractedLine = code.split('\n')[line - 1];
			if (extractedLine.length) return `\n${util.codeBlock('js', `${extractedLine}\n${' '.repeat(column - 1)}${'^'.repeat(endColumn - column)}`)}`;
		}
		return '';
	}

}
