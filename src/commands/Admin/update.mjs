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
		const { stdout, stderr } = await util.exec(`git pull origin ${branch}`);
		return message.sendCode('prolog', [stdout, stderr || '✔'].join('\n-=-=-=-\n'));
	}

}
