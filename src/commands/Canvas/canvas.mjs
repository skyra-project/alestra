import { Command as KlasaCommand, Stopwatch, util as KlasaUtil } from 'klasa';
import * as CanvasConstructor from 'canvas-constructor';
import { inspect } from 'util';

const { Canvas, ..._methods } = CanvasConstructor;
const methods = Object.entries(_methods);

const CODEBLOCK = /^```(?:js|javascript)?([\s\S]+)```$/;

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
			let output = await this.client.evaluator.parse(this.parseCodeblock(code), this.parseFlags(message.flags.vars));
			sw.stop();
			if (output instanceof Canvas) output = await output.toBufferAsync();
			if (output instanceof Buffer) return message.channel.sendFile(output, 'output.png', `\`✔\` \`⏱ ${sw}\``);
			return message.channel.send(`\`✔\` \`⏱ ${sw}\`\n${KlasaUtil.codeBlock('js', inspect(output, false, 0, false))}`);
		} catch (error) {
			if (sw.running) sw.stop();
			throw `\`❌\` \`⏱ ${sw}\`\n${KlasaUtil.codeBlock('', 'stack' in message.flags && message.author.id === this.client.owner.id ? error.stack : error)}`;
		}
	}

	parseCodeblock(code) {
		if (!CODEBLOCK.test(code)) return code;
		return CODEBLOCK.exec(code)[1];
	}

	parseFlags(flags) {
		if (typeof flags !== 'string') return methods;
		const vars = flags.split(',');
		const parsed = vars.map(flag => {
			const index = flag.indexOf('=');
			if (index === -1) throw `Could not parse '${flag}': There is no assignment.`;
			return [flag.slice(0, index), flag.slice(index + 1)];
		});
		return methods.concat(parsed);
	}

}
