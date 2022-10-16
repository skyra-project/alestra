import { hideLinkEmbed, hyperlink, inlineCode, time, TimestampStyles } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions, version as sapphireVersion } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Time } from '@sapphire/time-utilities';
import { roundNumber } from '@sapphire/utilities';
import { envParseString } from '@skyra/env-utilities';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Message, MessageActionRow, MessageButton, MessageEmbed, Permissions, version as discordjsVersion } from 'discord.js';
import { cpus, uptime, type CpuInfo } from 'node:os';

@ApplyOptions<CommandOptions>({
	aliases: ['info'],
	description: 'Provides information about Alestra'
})
export class UserCommand extends Command {
	private numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
	private readonly canvasConstructorServerInviteLink = 'https://discord.gg/taNgb9d';

	public override messageRun(message: Message) {
		return send(message, {
			embeds: [this.embed],
			components: this.components
		});
	}

	private get components(): MessageActionRow[] {
		return [
			new MessageActionRow().addComponents(
				new MessageButton() //
					.setStyle('LINK')
					.setURL(this.inviteLink)
					.setLabel('Add me to your server!')
					.setEmoji('🎉'),
				new MessageButton() //
					.setStyle('LINK')
					.setURL(this.canvasConstructorServerInviteLink)
					.setLabel('Support server')
					.setEmoji('🆘')
			),
			new MessageActionRow().addComponents(
				new MessageButton()
					.setStyle('LINK')
					.setURL('https://github.com/skyra-project/alestra')
					.setLabel('GitHub Repository')
					.setEmoji('<:github2:950888087188283422>'),
				new MessageButton() //
					.setStyle('LINK')
					.setURL('https://donate.skyra.pw/patreon')
					.setLabel('Donate')
					.setEmoji('🧡')
			)
		];
	}

	private get inviteLink() {
		return this.container.client.generateInvite({
			scopes: ['bot', 'applications.commands'],
			permissions: new Permissions([
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.ReadMessageHistory,
				PermissionFlagsBits.SendMessages,
				PermissionFlagsBits.EmbedLinks
			])
		});
	}

	private get embed(): MessageEmbed {
		const titles = {
			stats: 'Statistics',
			uptime: 'Uptime',
			serverUsage: 'Server Usage'
		};
		const stats = this.generalStatistics;
		const uptime = this.uptimeStatistics;
		const usage = this.usageStatistics;

		const fields = {
			stats: [
				//
				`• **Users**: ${stats.users}`,
				`• **Guilds**: ${stats.guilds}`,
				`• **Channels**: ${stats.channels}`,
				`• **Node.js**: ${stats.nodeJs}`,
				`• **Discord.js**: ${stats.discordjsVersion}`,
				`• **Sapphire Framework**: ${stats.sapphireVersion}`
			].join('\n'),
			uptime: [
				//
				`• **Host**: ${uptime.host}`,
				`• **Total**: ${uptime.total}`,
				`• **Client**: ${uptime.client}`
			].join('\n'),
			serverUsage: [
				//
				`• **CPU Load**: ${usage.cpuLoad}`,
				`• **Heap**: ${usage.ramUsed}MB (Total: ${usage.ramTotal}MB)`
			].join('\n')
		};

		const clientVersion = envParseString('CLIENT_VERSION');
		const canvasConstructorPackage = hyperlink(inlineCode("canvas-constructor's"), hideLinkEmbed('https://github.com/kyranet/CanvasConstructor'));
		const canvasConstructorServer = hyperlink('official canvas constructor server', hideLinkEmbed(this.canvasConstructorServerInviteLink));

		return new MessageEmbed() //
			.setColor(0xfcac42)
			.setDescription(`Alestra ${clientVersion} is a private Discord Bot used for ${canvasConstructorPackage} ${canvasConstructorServer}`)
			.setFields(
				{
					name: titles.stats,
					value: fields.stats,
					inline: true
				},
				{
					name: titles.uptime,
					value: fields.uptime
				},
				{
					name: titles.serverUsage,
					value: fields.serverUsage
				}
			);
	}

	private get generalStatistics(): StatsGeneral {
		const { client } = this.container;
		return {
			channels: client.channels.cache.size,
			guilds: client.guilds.cache.size,
			nodeJs: process.version,
			users: client.guilds.cache.reduce((acc, val) => acc + (val.memberCount ?? 0), 0),
			discordjsVersion: `v${discordjsVersion}`,
			sapphireVersion: `v${sapphireVersion}`
		};
	}

	private get uptimeStatistics(): StatsUptime {
		const now = Date.now();
		const nowSeconds = roundNumber(now / 1_000);
		return {
			client: time(this.secondsFromMilliseconds(now - this.container.client.uptime!), TimestampStyles.RelativeTime),
			host: time(roundNumber(nowSeconds - uptime()), TimestampStyles.RelativeTime),
			total: time(roundNumber(nowSeconds - process.uptime()), TimestampStyles.RelativeTime)
		};
	}

	private get usageStatistics(): StatsUsage {
		const usage = process.memoryUsage();
		return {
			cpuLoad: cpus().slice(0, 2).map(UserCommand.formatCpuInfo.bind(null)).join(' | '),
			ramTotal: this.formatNumber(usage.heapTotal / 1_048_576),
			ramUsed: this.formatNumber(usage.heapUsed / 1_048_576)
		};
	}

	private secondsFromMilliseconds(milliseconds: number): number {
		return roundNumber(milliseconds / Time.Second);
	}

	private formatNumber(number: number): string {
		return this.numberFormat.format(number);
	}

	private static formatCpuInfo({ times }: CpuInfo) {
		return `${roundNumber(((times.user + times.nice + times.sys + times.irq) / times.idle) * 10_000) / 100}%`;
	}
}

interface StatsGeneral {
	channels: number;
	guilds: number;
	nodeJs: string;
	users: number;
	discordjsVersion: string;
	sapphireVersion: string;
}

interface StatsUptime {
	client: string;
	host: string;
	total: string;
}

interface StatsUsage {
	cpuLoad: string;
	ramTotal: string;
	ramUsed: string;
}
