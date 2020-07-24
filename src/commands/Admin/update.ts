import { ApplyOptions } from '@skyra/decorators';
import { Command, CommandOptions } from 'klasa';
import { exec, sleep, codeBlock } from '@klasa/utils';
import { remove } from 'fs-nextra';
import { resolve } from 'path';
import { cutText } from '../../lib/util/util';
import { rootFolder, Emojis } from '../../lib/util/constants';
import type { Message } from '@klasa/core';

@ApplyOptions<CommandOptions>({
	aliases: ['pull'],
	description: 'Update the bot',
	guarded: true,
	permissionLevel: 10,
	usage: '[branch:string]'
})
export default class extends Command {

	public async run(message: Message, [branch = 'master']: [string?]) {
		await this.fetch(message, branch);
		await this.updateDependencies(message);
		await this.cleanDist(message);
		await this.compile(message);
		return message.responses;
	}

	private async compile(message: Message) {
		const { stderr, code } = await this.exec('yarn build');
		if (code !== 0 && stderr.length) throw stderr.trim();
		return message.channel.send(mb => mb.setContent(`${Emojis.GreenTick} Successfully compiled.`));
	}

	private async cleanDist(message: Message) {
		if (message.flagArgs.fullRebuild) {
			await remove(resolve(rootFolder, 'dist'));
			return message.channel.send(mb => mb.setContent(`${Emojis.GreenTick} Successfully cleaned old dist directory.`));
		}
	}

	private async updateDependencies(message: Message) {
		const { stderr, code } = await this.exec('yarn install --frozen-lockfile');
		if (code !== 0 && stderr.length) throw stderr.trim();
		return message.channel.send(mb => mb.setContent(`${Emojis.GreenTick} Successfully updated dependencies.`));
	}

	private async fetch(message: Message, branch: string) {
		await this.exec('git fetch');
		const { stdout, stderr } = await this.exec(`git pull origin ${branch}`);

		// If it's up to date, do nothing
		if (/already up(?: |-)to(?: |-)date/i.test(stdout)) throw `${Emojis.GreenTick} Up to date.`;

		// If it was not a successful pull, return the output
		if (!this.isSuccessfulPull(stdout)) {
			// If the pull failed because it was in a different branch, run checkout
			if (!await this.isCurrentBranch(branch)) {
				return this.checkout(message, branch);
			}

			// If the pull failed because local changes, run a stash
			if (this.needsStash(stdout + stderr)) return this.stash(message);
		}

		// For all other cases, return the original output
		return message.channel.send(mb => mb.setContent(codeBlock('prolog', [cutText(stdout, 1800) || Emojis.GreenTick, cutText(stderr, 100) || Emojis.GreenTick].join('\n-=-=-=-\n'))));
	}

	private async stash(message: Message) {
		await message.channel.send(mb => mb.setContent('Unsuccessful pull, stashing...'));
		await sleep(1000);
		const { stdout, stderr } = await this.exec(`git stash`);
		if (!this.isSuccessfulStash(stdout + stderr)) {
			throw `Unsuccessful pull, stashing:\n\n${codeBlock('prolog', [stdout || '✔', stderr || '✔'].join('\n-=-=-=-\n'))}`;
		}

		return message.channel.send(mb => mb.setContent(codeBlock('prolog', [cutText(stdout, 1800) || '✔', cutText(stderr, 100) || '✔'].join('\n-=-=-=-\n'))));
	}

	private async checkout(message: Message, branch: string) {
		await message.channel.send(mb => mb.setContent(`Switching to ${branch}...`));
		await this.exec(`git checkout ${branch}`);
		return message.channel.send(mb => mb.setContent(`${Emojis.GreenTick} Switched to ${branch}.`));
	}

	private async isCurrentBranch(branch: string) {
		const { stdout } = await this.exec('git symbolic-ref --short HEAD');
		return stdout === `refs/heads/${branch}\n` || stdout === `${branch}\n`;
	}

	private isSuccessfulPull(output: string) {
		return /\d+\s*file\s*changed,\s*\d+\s*insertions?\([+-]\),\s*\d+\s*deletions?\([+-]\)/.test(output);
	}

	private isSuccessfulStash(output: string) {
		return output.includes('Saved working directory and index state WIP on');
	}

	private needsStash(output: string) {
		return output.includes('Your local changes to the following files would be overwritten by merge');
	}

	private async exec(script: string) {
		try {
			const result = await exec(script);
			return { ...result, code: 0 };
		} catch (error) {
			return { stdout: '', stderr: (error as Error).message, code: ((error as Error & { code: number }).code ?? 1) as number };
		}
	}

}
