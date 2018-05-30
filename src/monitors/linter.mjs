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

		this.displays = new Map();
	}

	async run(message) {
		if (!message.guild
			|| !message.channel.permissionsFor(message.guild.me).has(FLAGS.MANAGE_MESSAGES)
			|| !message.guild.configs.supportChannels.includes(message.channel.id)
			|| !CODEBLOCK_REGEXP.test(message.content)) return;

		const oldHandler = this.displays.get(message.author.id);
		if (oldHandler) {
			if (!oldHandler.message.deleted) oldHandler.message.delete();
			await oldHandler.stop();
		}

		const code = CODEBLOCK_REGEXP.exec(message.content)[1].trim();
		const errors = checkErrors(code);
		if (!errors.length) {
			await message.react('greenTick:451517251317923851');
			return;
		}

		await message.react('redCross:451517251464593411');
		await message.react('🔍');
		const reactions = await message.awaitReactions((reaction, user) => user.id === message.author.id && reaction.emoji.name === '🔍', { time: 15000, max: 1 });
		if (!reactions.size) {
			await message.reactions.removeAll();
			return;
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

		this.displays.set(message.author.id, handler);
		handler.once('end', () => { this.displays.delete(message.author.id); });
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

	async init() {
		if (!this.client.gateways.guilds.schema.has('supportChannels'))
			await this.client.gateways.guilds.schema.add('supportChannels', { array: true, type: 'textchannel' });
	}

}
