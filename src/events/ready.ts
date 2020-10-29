import { DEV, VERSION } from '@root/config';
import { ApplyOptions } from '@sapphire/decorators';
import { Event, EventOptions } from '@sapphire/framework';
import { green, magenta, magentaBright, red, yellow, yellowBright } from 'colorette';

const success = green('+');
const failed = red('-');
const llc = DEV ? magentaBright : yellowBright;
const blc = DEV ? magenta : yellow;

@ApplyOptions<EventOptions>({ once: true })
export class UserEvent extends Event<'ready'> {
	public run() {
		this.client.logger.info(`${llc(`         ¿        `)}       __      ___       _______   ________  ___________  _______        __
${llc(`        ▓▓¿       `)}      /""\\    |"  |     /"     "| /"       )("     _   ")/"      \\      /""\\
${llc(`       ▓▓▓▓Ç      `)}     /    \\   ||  |    (: ______)(:   \\___/  )__/  \\\\__/|:        |    /    \\
${llc(`      ▓▓╝╙▓▓Ç     `)}    /' /\\  \\  |:  |     \\/    |   \\___  \\       \\\\_ /   |_____/   )   /' /\\  \\
${blc(`     ▓▓╜  ╙▓▓╕    `)}   //  __'  \\  \\  |___  // ___)_   __/  \\\\      |.  |    //      /   //  __'  \\
${blc(`    á╣╛    └▓╣╕   `)}  /   /  \\\\  \\( \\_|:  \\(:      "| /" \\   :)     \\:  |   |:  __   \\  /   /  \\\\  \\
${blc(`   "▓╛  ${llc(`▓▓⌐`)} "▓╜   `)} (___/    \\___)\\_______)\\_______)(_______/       \\__|   |__|  \\___)(___/    \\___)
${llc(`      ┌▓▓▓▓╕      `)} ${VERSION.padStart(80, ' ')}
${llc(`     ╓▓▓▓▓▓▓▄     `)} [${success}] Gateway
${llc(`    Æ▓▓▓┘└▓▓▓▓    `)} [${Reflect.get(this.client, 'websocket') ? success : failed}] Evlyn Bridge
${llc(`   ▓▓▓▓└  '▓▓▓▓,  `)}
${llc(` ,▓╣╣▓      ╚╣╣▓┐ `)}
${blc(` ╙▓▓▓W,     g▓▓▓▀ `)}
${blc(`   └▓▓▓▓¿,φ▓▓▓└   `)}
${blc(`     ,╚▓╣╣╣▓└     `)}${DEV ? ' DEVELOPMENT MODE' : ''}
${blc(`        ╙╜,       `)}`);
	}
}
