import { DEV, VERSION } from '@root/config';
import { Event } from '@sapphire/framework';
import { green, magenta, red, yellow } from 'colorette';

const success = green('+');
const failed = red('-');
const logoColor = DEV ? magenta : yellow;

export class UserEvent extends Event<'ready'> {
	public run() {
		this.client.logger.info(`
${logoColor(`         ¿        `)}       __      ___       _______   ________  ___________  _______        __
${logoColor(`        ▓▓¿       `)}      /""\\    |"  |     /"     "| /"       )("     _   ")/"      \\      /""\\
${logoColor(`       ▓▓▓▓Ç      `)}     /    \\   ||  |    (: ______)(:   \\___/  )__/  \\\\__/|:        |    /    \\
${logoColor(`      ▓▓╝╙▓▓Ç     `)}    /' /\\  \\  |:  |     \\/    |   \\___  \\       \\\\_ /   |_____/   )   /' /\\  \\
${logoColor(`     ▓▓╜  ╙▓▓╕    `)}   //  __'  \\  \\  |___  // ___)_   __/  \\\\      |.  |    //      /   //  __'  \\
${logoColor(`    á╣╛    └▓╣╕   `)}  /   /  \\\\  \\( \\_|:  \\(:      "| /" \\   :)     \\:  |   |:  __   \\  /   /  \\\\  \\
${logoColor(`   "▓╛  ▓▓⌐ "▓╜   `)} (___/    \\___)\\_______)\\_______)(_______/       \\__|   |__|  \\___)(___/    \\___)
${logoColor(`      ┌▓▓▓▓╕      `)} ${VERSION.padStart(80, ' ')}
${logoColor(`     ╓▓▓▓▓▓▓▄     `)} [${success}] Gateway
${logoColor(`    Æ▓▓▓┘└▓▓▓▓    `)} [${Reflect.get(this.client, 'websocket') ? success : failed}] Evlyn Bridge
${logoColor(`   ▓▓▓▓└  '▓▓▓▓,  `)}
${logoColor(` ,▓╣╣▓      ╚╣╣▓┐ `)}
${logoColor(` ╙▓▓▓W,     g▓▓▓▀ `)}
${logoColor(`   └▓▓▓▓¿,φ▓▓▓└   `)}
${logoColor(`     ,╚▓╣╣╣▓└     `)}${DEV ? ' DEVELOPMENT MODE' : ''}
${logoColor(`        ╙╜,       `)}`);
	}
}
