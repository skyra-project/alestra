import { Command } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { DurationFormatter } from '@sapphire/time-utilities';
import { Message, MessageEmbed, version } from 'discord.js';
import { cpus, uptime } from 'os';

export default class UserCommand extends Command {
	private readonly formatter = new DurationFormatter();

	public async messageRun(message: Message) {
		const embed = new MessageEmbed()
			.setColor(0xfcac42)
			.addField('Statistics', this.generalStatistics)
			.addField('Uptime', this.uptimeStatistics)
			.addField('Server Usage', this.usageStatistics);
		return send(message, { embeds: [embed] });
	}

	private get generalStatistics(): string {
		return [
			this.format('Users', this.container.client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString()),
			this.format('Guilds', this.container.client.guilds.cache.size.toLocaleString()),
			this.format('Channels', this.container.client.channels.cache.size.toLocaleString()),
			this.format('Discord.js', `v${version}`),
			this.format('Node.js', process.version),
			this.format('Sapphire', 'v1.0.0')
		].join('\n');
	}

	private get uptimeStatistics(): string {
		return [
			this.format('Host', this.formatDuration(uptime() * 1000)),
			this.format('Total', this.formatDuration(process.uptime() * 1000)),
			this.format('Client', this.formatDuration(this.container.client.uptime!))
		].join('\n');
	}

	private get usageStatistics(): string {
		const usage = process.memoryUsage();
		const ramUsed = `${Math.round(100 * (usage.heapUsed / 1048576)) / 100}MB`;
		const ramTotal = `${Math.round(100 * (usage.heapTotal / 1048576)) / 100}MB`;
		const cpu = cpus()
			.map(({ times }) => `${Math.round(((times.user + times.nice + times.sys + times.irq) / times.idle) * 10000) / 100}%`)
			.join(' | ');

		return [this.format('CPU Load', cpu), this.format('Heap', `${ramUsed} (${ramTotal})`)].join('\n');
	}

	private format(name: string, value: string): string {
		return `• **${name}**: ${value}`;
	}

	private formatDuration(value: number): string {
		return this.formatter.format(value, 2);
	}
}
