import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { DurationFormatAssetsTime, friendlyDuration, TimeTypes } from '@utils/FriendlyDuration';
import { Message, MessageEmbed, version } from 'discord.js';
import { cpus, uptime } from 'os';

@ApplyOptions<CommandOptions>({
	aliases: ['execute']
})
export default class UserCommand extends Command {
	public async run(message: Message) {
		return message.send(
			new MessageEmbed()
				.setColor(0xfcac42)
				.addField('Statistics', this.generalStatistics)
				.addField('Uptime', this.uptimeStatistics)
				.addField('Server Usage', this.usageStatistics)
		);
	}

	private get generalStatistics(): string {
		return [
			this.format('Users', this.context.client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString()),
			this.format('Guilds', this.context.client.guilds.cache.size.toLocaleString()),
			this.format('Channels', this.context.client.channels.cache.size.toLocaleString()),
			this.format('Discord.js', `v${version}`),
			this.format('Node.js', process.version),
			this.format('Sapphire', 'v1.0.0')
		].join('\n');
	}

	private get uptimeStatistics(): string {
		return [
			this.format('Host', this.formatDuration(uptime() * 1000)),
			this.format('Total', this.formatDuration(process.uptime() * 1000)),
			this.format('Client', this.formatDuration(this.context.client.uptime!))
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
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		return friendlyDuration(value, TIMES, 2);
	}
}

const TIMES: DurationFormatAssetsTime = {
	[TimeTypes.Year]: {
		1: 'year',
		DEFAULT: 'years'
	},
	[TimeTypes.Month]: {
		1: 'month',
		DEFAULT: 'months'
	},
	[TimeTypes.Week]: {
		1: 'week',
		DEFAULT: 'weeks'
	},
	[TimeTypes.Day]: {
		1: 'day',
		DEFAULT: 'days'
	},
	[TimeTypes.Hour]: {
		1: 'hour',
		DEFAULT: 'hours'
	},
	[TimeTypes.Minute]: {
		1: 'minute',
		DEFAULT: 'minutes'
	},
	[TimeTypes.Second]: {
		1: 'second',
		DEFAULT: 'seconds'
	}
};
