import { ApplyOptions } from '@skyra/decorators';
import { Canvas } from 'canvas-constructor';
import { Command as KlasaCommand, CommandOptions, KlasaMessage, Stopwatch, util as KlasaUtil } from 'klasa';
import { ScriptTarget, transpileModule, TranspileOptions } from 'typescript';
import { inspect } from 'util';
import { evaluate } from '../../lib/Canvas/Parser/Evaluator';

const tsTranspileOptions: TranspileOptions = { compilerOptions: { allowJs: true, checkJs: true, target: ScriptTarget.ESNext } };

const CODEBLOCK = /^```(?:js|javascript)?([\s\S]+)```$/;

@ApplyOptions<CommandOptions>({
	bucket: 1,
	cooldown: 5,
	description: 'Execute a sandboxed subset of JavaScript',
	requiredPermissions: ['ATTACH_FILES'],
	runIn: ['text'],
	usage: '<code:string>',
	flagSupport: true
})
export default class extends KlasaCommand {

	public async run(message: KlasaMessage, [code]: [string]): Promise<KlasaMessage | KlasaMessage[]> {
		code = this.parseCodeblock(code);
		const sw = new Stopwatch(5);
		try {
			let output = await evaluate(message.flagArgs.ts ? transpileModule(code, tsTranspileOptions).outputText : code);
			sw.stop();
			if (output instanceof Canvas) output = await output.toBufferAsync();
			// @ts-ignore
			if (output instanceof Buffer) return message.channel.sendFile(output, 'output.png', `\`✔\` \`⏱ ${sw}\``);
			// @ts-ignore
			return message.send(`\`✔\` \`⏱ ${sw}\`\n${KlasaUtil.codeBlock('js', inspect(output, false, 0, false))}`);
		} catch (error) {
			if (sw.running) sw.stop();
			throw `\`❌\` \`⏱ ${sw}\`\n${KlasaUtil.codeBlock('', 'stack' in message.flags && this.client.options.owners.includes(message.author!.id) ? error.stack : error)}`;
		}
	}

	public parseCodeblock(code: string): string {
		return CODEBLOCK.test(code) ? CODEBLOCK.exec(code)![1].trim() : code;
	}

}
