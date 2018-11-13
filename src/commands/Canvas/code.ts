import { Canvas } from 'canvas-constructor';
import { Command as KlasaCommand, CommandStore, KlasaClient, KlasaMessage, Stopwatch, util as KlasaUtil } from 'klasa';
import { ScriptTarget, transpileModule, TranspileOptions } from 'typescript';
import { inspect } from 'util';
import { evaluate } from '../../lib/Canvas/Parser/Evaluator';

const tsTranspileOptions: TranspileOptions = { compilerOptions: { allowJs: true, checkJs: true, target: ScriptTarget.ESNext } };

const CODEBLOCK = /^```(?:js|javascript)?([\s\S]+)```$/;

export default class Command extends KlasaCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			bucket: 1,
			cooldown: 10,
			description: 'Execute a sandboxed subset of JavaScript',
			requiredPermissions: ['ATTACH_FILES'],
			runIn: ['text'],
			usage: '<code:string>'
		});
	}

	public async run(message: KlasaMessage, [code]: [string]): Promise<KlasaMessage | KlasaMessage[]> {
		code = this.parseCodeblock(code);
		const sw = new Stopwatch(5);
		try {
			let output = await evaluate(message.flags.ts ? transpileModule(code, tsTranspileOptions).outputText : code);
			sw.stop();
			if (output instanceof Canvas) output = await output.toBufferAsync();
			// @ts-ignore
			if (output instanceof Buffer) return message.channel.sendFile(output, 'output.png', `\`✔\` \`⏱ ${sw}\``);
			// @ts-ignore
			return message.channel.send(`\`✔\` \`⏱ ${sw}\`\n${KlasaUtil.codeBlock('js', inspect(output, false, 0, false))}`);
		} catch (error) {
			if (sw.running) sw.stop();
			throw `\`❌\` \`⏱ ${sw}\`\n${KlasaUtil.codeBlock('', 'stack' in message.flags && message.author.id === this.client.owner.id ? error.stack : error)}`;
		}
	}

	public parseCodeblock(code: string): string {
		return CODEBLOCK.test(code) ? CODEBLOCK.exec(code)[1].trim() : code;
	}

}
