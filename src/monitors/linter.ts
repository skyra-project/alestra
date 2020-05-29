import { KlasaMessage, Monitor as KlasaMonitor, MonitorStore, ReactionHandler, RichDisplay } from 'klasa';
import { checkErrors, CODEBLOCK_REGEXP } from '../lib/Linter/Linter';
import { GuildChannel, Permissions, Embed } from '@klasa/core';
import { codeBlock } from '@klasa/utils';

export default class Monitor extends KlasaMonitor {

	private readonly handlers = new Map<string, { handler: ReactionHandler; message: KlasaMessage }>();
	private readonly dev: boolean;
	private readonly kCanvasConstructorEmoji = '<:canvasconstructor:451438332375728128>';

	public constructor(store: MonitorStore, directory: string, file: string[]) {
		super(store, directory, file, {
			ignoreOthers: false,
			ignoreEdits: false
		});
		this.dev = this.client.options.dev;
	}

	public async run(message: KlasaMessage): Promise<void> {
		// If it's in development mode, ignore anyone else that is not the owner
		if (this.dev && this.client.options.owners.includes(message.author!.id)) return;
		// If it's not in a guild, return
		if (!message.guild) return;
		// If this is not a support channel, return
		if (!(message.guild.settings.get('supportChannels') as string[]).includes(message.channel.id)) return;
		// If I don't have permissions, return
		if (!(message.channel as GuildChannel).permissionsFor(message.guild!.me!)!.has(Permissions.FLAGS.MANAGE_MESSAGES)) return;
		// If there is no codeblock, return
		if (!CODEBLOCK_REGEXP.test(message.content)) return;

		const oldHandler = this.handlers.get(message.author!.id);
		if (oldHandler) {
			oldHandler.handler.stop();
		}

		const code = CODEBLOCK_REGEXP.exec(message.content)![1].trim();
		const errors = checkErrors(code);
		if (!errors.length) {
			if (message.reactions.has('451517251464593411')) await message.reactions.remove();
			await message.reactions.add('greenTick:451517251317923851');
			return;
		}

		if (message.reactions.has('451517251317923851')) await message.reactions.remove();

		if (!oldHandler || oldHandler.message !== message) {
			await message.reactions.add('redCross:451517251464593411');
			await message.reactions.add('🔍');
			const reactions = await message.awaitReactions({ idle: 15000, limit: 1, filter: ([reaction, user]) => user.id === message.author!.id && reaction.emoji.name === '🔍' });
			if (message.deleted) return;
			if (reactions.size) {
				const reaction = message.reactions.get('🔍');
				if (reaction) await reaction.users.remove(message.author!.id).catch(() => null);
			} else {
				const reaction = message.reactions.get('🔍');
				if (reaction) await reaction.users.remove(this.client.user!.id).catch(() => null);
			}
		}

		const richDisplay = new RichDisplay({
			template: new Embed()
				.setColor(0xFF7327)
				// .setAuthor(this.client.user!.username, this.client.user!.avatarURL({ size: 64 }))
				.setAuthor(this.client.user!.username)
				.setTitle('ESLint Errors')
		});

		for (const error of errors) {
			richDisplay.addPage(template => template.setDescription([
				`[\`${error.ruleId || 'Parsing Error'}\`] (Severity ${error.severity}) at ${
					this._displayRanges(error.line, error.endLine || 0)}:${
					this._displayRanges(error.column, error.endColumn || 0)
				}\n\`\`${error.message}\`\`${this._displayText(code, error.line, error.endLine ?? error.line, error.column, error.endColumn)}`
			].join('\n')));
		}

		const sent = (await message.channel.send(mb => mb.setContent(`${this.kCanvasConstructorEmoji} | Please wait...`)))[0];
		const handler = await richDisplay.run(sent, {
			filter: ([, user]) => user.id === message.author!.id, idle: 120000, onceDone: () => {
				this.handlers.delete(message.author!.id);
				if (!sent.deleted) sent.delete().catch(() => null);
				if (!message.deleted) {
					const reaction = message.reactions.get('🔍');
					if (reaction && reaction.users.has(this.client.user!.id)) reaction.users.remove(this.client.user!.id).catch(() => null);
				}
			}
		});

		this.handlers.set(message.author!.id, { handler, message });
	}

	public _displayRanges(start: number, end: number): string {
		if (typeof end !== 'number') return String(start);
		if (start === end) return String(start);
		return `${start}-${end}`;
	}

	public _displayText(code: string, line: number, endLine: number, column: number, endColumn: number = column): string {
		const singleLine = typeof endLine !== 'number' || line === endLine;
		if (singleLine) {
			const extractedLine = code.split('\n')[line - 1];
			if (extractedLine.length) return `\n${codeBlock('js', `${extractedLine}\n${' '.repeat(column - 1)}${'^'.repeat(endColumn - column)}`)}`;
		}
		return '';
	}

}
