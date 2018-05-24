import { Command as KlasaCommand, util } from 'klasa';

export default class Command extends KlasaCommand {

	constructor(...args) {
		super(...args, {
			aliases: ['pull'],
			description: 'Update the bot',
			guarded: true,
			permissionLevel: 10
		});
	}

	async run(message) {
		const { stdout, stderr } = await util.exec(`git pull github.com/kyranet/Smii.git`);
		return message.sendCode('prolog', [stdout, stderr || '✔'].join('\n-=-=-=-\n'));
	}

}
