import { Command } from 'klasa';
import { Canvas } from 'canvas-constructor';

export default class extends Command {

	constructor(...args) {
		super(...args, {
			runIn: ['text'],
			requiredPermissions: ['ATTACH_FILES'],
			bucket: 1,
			cooldown: 10,
			description: 'Render a Canvas-Constructor',
			extendedHelp: 'No extended help available.',
			usage: '<code:string>'
		});
	}

	async run(message, [code]) {
		try {
			let output = await this.client.evaluator.parse(code);
			if (output instanceof Canvas) output = await output.toBufferAsync();
			return message.channel.sendFile(output, 'output.png');
		} catch (error) {
			return message.sendCode('', error.toString());
		}
	}

}
