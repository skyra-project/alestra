import { DEV, VERSION } from '@root/config';
import { ApplyOptions } from '@sapphire/decorators';
import { Event, EventOptions } from '@sapphire/framework';
import { green, magenta, magentaBright, red, yellow, yellowBright } from 'colorette';

@ApplyOptions<EventOptions>({ once: true })
export class UserEvent extends Event<'ready'> {
	public run() {
		const success = green('+');
		const failed = red('-');
		const llc = DEV ? magentaBright : yellowBright;
		const blc = DEV ? magenta : yellow;

		const line01 = llc(`         ¿        `);
		const line02 = llc(`        ▓▓¿       `);
		const line03 = llc(`       ▓▓▓▓Ç      `);
		const line04 = llc(`      ▓▓╝╙▓▓Ç     `);
		const line05 = blc(`     ▓▓╜  ╙▓▓╕    `);
		const line06 = blc(`    á╣╛    └▓╣╕   `);
		const line07 = blc(`   "▓╛  ${llc(`▓▓⌐`)} "▓╜   `);
		const line08 = llc(`      ┌▓▓▓▓╕      `);
		const line09 = llc(`     ╓▓▓▓▓▓▓▄     `);
		const line10 = llc(`    Æ▓▓▓┘└▓▓▓▓    `);
		const line11 = llc(`   ▓▓▓▓└  '▓▓▓▓,  `);
		const line12 = llc(` ,▓╣╣▓      ╚╣╣▓┐ `);
		const line13 = blc(` ╙▓▓▓W,     g▓▓▓▀ `);
		const line14 = blc(`   └▓▓▓▓¿,φ▓▓▓└   `);
		const line15 = blc(`     ,╚▓╣╣╣▓└     `);
		const line16 = blc(`        ╙╜,       `);

		this.client.logger.info(
			String.raw`
${line01}       __      ___       _______   ________  ___________  _______        __
${line02}      /""\    |"  |     /"     "| /"       )("     _   ")/"      \      /""\
${line03}     /    \   ||  |    (: ______)(:   \___/  )__/  \\__/|:        |    /    \
${line04}    /' /\  \  |:  |     \/    |   \___  \       \\_ /   |_____/   )   /' /\  \
${line05}   //  __'  \  \  |___  // ___)_   __/  \\      |.  |    //      /   //  __'  \
${line06}  /   /  \\  \( \_|:  \(:      "| /" \   :)     \:  |   |:  __   \  /   /  \\  \
${line07} (___/    \___)\_______)\_______)(_______/       \__|   |__|  \___)(___/    \___)
${line08} ${llc(VERSION.padStart(80, ' '))}
${line09} [${success}] Gateway
${line10} [${Reflect.get(this.client, 'websocket') ? success : failed}] Evlyn Bridge
${line11}
${line12}
${line13}
${line14}
${line15}${DEV ? ' DEVELOPMENT MODE' : ''}
${line16}`.trim()
		);
	}
}
