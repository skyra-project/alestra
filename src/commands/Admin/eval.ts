import { codeBlock, isThenable, sleep } from '@klasa/utils';
import { ApplyOptions } from '@skyra/decorators';
import { Command, CommandOptions, KlasaMessage, Stopwatch, Type } from 'klasa';
import { inspect } from 'util';
import { Events, PermissionLevels } from '../../lib/types/Enums';
import { clean } from '../../lib/util/clean';
import { EvalExtraData, handleMessage } from '../../lib/util/ExceededLengthParser';

@ApplyOptions<CommandOptions>({
	aliases: ['ev'],
	description: 'Evaluates arbitrary Javascript. Reserved for bot owner.',
	guarded: true,
	permissionLevel: PermissionLevels.BotOwner,
	usage: '<expression:str>',
	flagSupport: true
})
export default class extends Command {

	private readonly kTimeout = 60000;

	public async run(message: KlasaMessage, [code]: [string]) {
		const flagTime = 'no-timeout' in message.flagArgs ? 'wait' in message.flagArgs ? Number(message.flagArgs.wait) : this.kTimeout : Infinity;
		const language = message.flagArgs.lang || message.flagArgs.language || (message.flagArgs.json ? 'json' : 'js');
		const { success, result, time, type } = await this.timedEval(message, code, flagTime);

		if (message.flagArgs.silent) {
			if (!success && result && (result as unknown as Error).stack) this.client.emit(Events.Wtf, (result as unknown as Error).stack);
			return null;
		}

		const footer = codeBlock('ts', type);
		const sendAs = message.flagArgs.output || message.flagArgs['output-to'] || (message.flagArgs.log ? 'log' : null);
		return handleMessage<Partial<EvalExtraData>>(message, {
			sendAs,
			hastebinUnavailable: false,
			url: null,
			canLogToConsole: true,
			success,
			result,
			time,
			footer,
			language
		});
	}

	private timedEval(message: KlasaMessage, code: string, flagTime: number) {
		if (flagTime === Infinity || flagTime === 0) return this.eval(message, code);
		return Promise.race([
			sleep(flagTime).then(() => ({
				result: `TIMEOUT: Took longer than ${flagTime / 1000} seconds.`,
				success: false,
				time: '⏱ ...',
				type: 'EvalTimeoutError'
			})),
			this.eval(message, code)
		]);
	}

	// Eval the input
	private async eval(message: KlasaMessage, code: string) {
		const stopwatch = new Stopwatch();
		let success: boolean;
		let syncTime: string;
		let asyncTime: string;
		let result: unknown;
		let thenable = false;
		let type: Type;
		try {
			if (message.flagArgs.async) code = `(async () => {\n${code}\n})();`;
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore 6133
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const msg = message;
			// eslint-disable-next-line no-eval
			result = eval(code);
			syncTime = stopwatch.toString();
			type = new Type(result);
			if (isThenable(result)) {
				thenable = true;
				stopwatch.restart();
				result = await result;
				asyncTime = stopwatch.toString();
			}
			success = true;
		} catch (error) {
			if (!syncTime!) syncTime = stopwatch.toString();
			if (thenable && !asyncTime!) asyncTime = stopwatch.toString();
			if (!type!) type = new Type(error);
			result = error;
			success = false;
		}

		stopwatch.stop();
		if (typeof result !== 'string') {
			result = result instanceof Error
				? result.stack
				: message.flagArgs.json
					? JSON.stringify(result, null, 4)
					: inspect(result, {
						depth: message.flagArgs.depth ? parseInt(message.flagArgs.depth, 10) || 0 : 0,
						showHidden: Boolean(message.flagArgs.showHidden)
					});
		}
		return { success, type: type!, time: this.formatTime(syncTime!, asyncTime!), result: clean(result as string) };
	}

	private formatTime(syncTime: string, asyncTime: string) {
		return asyncTime ? `⏱ ${asyncTime}<${syncTime}>` : `⏱ ${syncTime}`;
	}

}
