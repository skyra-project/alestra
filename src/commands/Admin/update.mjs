import { Command as KlasaCommand, util } from 'klasa';

export default class Command extends KlasaCommand {

	constructor(...args) {
		super(...args, {
			aliases: ['pull'],
			description: 'Update the bot',
			guarded: true,
			permissionLevel: 10,
			usage: '[branch:string]'
		});
	}

	async run(message, [branch = 'master']) {
		const pullResponse = await util.exec(`git pull origin ${branch}`);
		const response = await message.channel.sendCode('prolog', [pullResponse.stdout, pullResponse.stderr || '✔'].join('\n-=-=-=-\n'));
		if ((await util.exec('git rev-parse --abbrev-ref HEAD')).stdout !== branch) {
			const switchResponse = await message.channel.send(`Switching to ${branch}...`);
			const checkoutResponse = await util.exec(`git checkout ${branch}`);
			await switchResponse.edit([checkoutResponse.stdout, checkoutResponse.stderr || '✔'].join('\n-=-=-=-\n'), { code: 'prolog' });
			if ('reboot' in message.flags) return this.store.get('reboot').run(message);
		} else if (!pullResponse.stdout.includes('Already up-to-date.') && ('reboot' in message.flags)) {
			return this.store.get('reboot').run(message);
		}
		return response;
	}

}
