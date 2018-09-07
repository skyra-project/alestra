import { Monitor as KlasaMonitor, RichDisplay, util } from 'klasa';
import { default as Discord } from 'discord.js';
import {
	CODEBLOCK_REGEXP,
	checkErrors
} from '../lib/Linter/Linter';

const { MessageEmbed, Permissions: { FLAGS } } = Discord;

export default class Monitor extends KlasaMonitor {

	constructor(...args) {
		super(...args, { ignoreOthers: false, ignoreEdits: false });

		this.handlers = new Map();
		this.dev = this.client.options.dev;
	}

	async run(message) {
		if (!(message.guild
			&& this.dev ? message.author.id === this.client.options.ownerID : true
			&& message.channel.permissionsFor(message.guild.me).has(FLAGS.MANAGE_MESSAGES)
			&& message.guild.configs.supportChannels.includes(message.channel.id)
			&& CODEBLOCK_REGEXP.test(message.content))) return;

		const oldHandler = this.handlers.get(message.author.id);
		if (oldHandler)
			await oldHandler.handler.stop();

		const code = CODEBLOCK_REGEXP.exec(message.content)[1].trim();
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
			const reactions = await message.awaitReactions((reaction, user) => user.id === message.author.id && reaction.emoji.name === '🔍', { time: 15000, max: 1 });
			if (message.deleted) return;
			if (!reactions.size) {
				const reaction = message.reactions.get('🔍');
				if (reaction && reaction.users.has(this.client.user.id)) await reaction.users.remove(this.client.user).catch(() => null);
				return;
			} else {
				const reaction = message.reactions.get('🔍');
				if (reaction && reaction.users.has(message.author.id)) await reaction.users.remove(message.author).catch(() => null);
			}
		}

		const richDisplay = new RichDisplay(new MessageEmbed()
			.setColor(0xFF7327)
			.setAuthor(this.client.user.username, this.client.user.avatarURL({ size: 64 }))
			.setTitle('ESLint Errors'));
		for (const error of errors) {
			richDisplay.addPage(template => template.setDescription([
				`[\`${error.ruleId || 'Parsing Error'}\`] (Severity ${error.severity}) at ${
					this._displayRanges(error.line, error.endLine)}:${
					this._displayRanges(error.column, error.endColumn)
				}\n\`\`${error.message}\`\`${this._displayText(code, error.line, error.endLine, error.column, error.endColumn)}`
			].join('\n')));
		}
		const handler = await richDisplay.run(
			await message.channel.send('<:canvasconstructor:451438332375728128> | Please wait...'),
			{ filter: (_, user) => user.id === message.author.id });

		this.handlers.set(message.author.id, { handler, message });
		handler.once('end', () => {
			this.handlers.delete(message.author.id);
			if (!handler.message.deleted) handler.message.delete().catch(() => null);
			if (!message.deleted) {
				const reaction = message.reactions.get('🔍');
				if (reaction && reaction.users.has(this.client.user.id)) reaction.users.remove(this.client.user).catch(() => null);
			}
		});
	}

	_displayRanges(start, end) {
		if (typeof end !== 'number') return start;
		if (start === end) return start;
		return `${start}-${end}`;
	}

	_displayText(code, line, endLine = line, column, endColumn = column) {
		const singleLine = typeof endLine !== 'number' || line === endLine;
		if (singleLine) {
			const extractedLine = code.split('\n')[line - 1];
			if (extractedLine.length) return `\n${util.codeBlock('js', `${extractedLine}\n${' '.repeat(column - 1)}${'^'.repeat(endColumn - column)}`)}`;
		}
		return '';
	}

}
