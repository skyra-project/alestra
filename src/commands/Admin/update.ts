import { Command as KlasaCommand, CommandStore, KlasaClient, KlasaMessage, util } from 'klasa';

export default class Command extends KlasaCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['pull'],
			description: 'Update the bot',
			guarded: true,
			permissionLevel: 10,
			usage: '[branch:string]'
		});
	}

	public async run(message: KlasaMessage, [branch = 'master']: [string?]): Promise<KlasaMessage | KlasaMessage[]> {
		const pullResponse = await util.exec(`git pull origin ${branch}`);
		// @ts-ignore
		const response = <KlasaMessage> await message.channel.sendCode('prolog', [pullResponse.stdout, pullResponse.stderr || '✔'].join('\n-=-=-=-\n'));
		if (!await this.isCurrentBranch(branch)) {
			const switchResponse = <KlasaMessage> await message.channel.send(`Switching to ${branch}...`);
			const checkoutResponse = await util.exec(`git checkout ${branch}`);
			await switchResponse.edit([checkoutResponse.stdout, checkoutResponse.stderr || '✔'].join('\n-=-=-=-\n'), { code: 'prolog' });
			if ('reboot' in message.flags) return this.store.get('reboot').run(message, []);
		} else if (!pullResponse.stdout.includes('Already up-to-date.') && ('reboot' in message.flags)) {
			return this.store.get('reboot').run(message, []);
		}
		return response;
	}

	public async isCurrentBranch(branch: string): Promise<boolean> {
		const { stdout } = await util.exec('git symbolic-ref --short HEAD');
		return stdout === `refs/heads/${branch}\n` || stdout === `${branch}\n`;
	}

}
