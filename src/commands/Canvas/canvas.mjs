import { Command as KlasaCommand, Stopwatch, util as KlasaUtil } from 'klasa';
import { Canvas } from 'canvas-constructor';
import { inspect } from 'util';

export default class Command extends KlasaCommand {

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
		const sw = new Stopwatch(5);
		try {
			let output = await this.client.evaluator.parse(code);
			sw.stop();
			if (output instanceof Canvas) output = await output.toBufferAsync();
			if (output instanceof Buffer) return message.channel.sendFile(output, 'output.png', `\`✔\` \`⏱ ${sw}\``);
			return message.channel.send(`\`✔\` \`⏱ ${sw}\`\n${KlasaUtil.codeBlock('js', inspect(output, false, 0, false))}`);
		} catch (error) {
			if (sw.running) sw.stop();
			throw `\`❌\` \`⏱ ${sw}\`\n${KlasaUtil.codeBlock('', error)}`;
		}
	}

}
