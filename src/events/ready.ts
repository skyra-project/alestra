import { VERSION } from '@root/config';
import { Event } from '@sapphire/framework';
import { green, red, yellow } from 'colorette';

const success = green('+');
const failed = red('-');

export class UserEvent extends Event<'ready'> {
	public run() {
		this.client.logger.info(`
${yellow(`         ¿        `)}       __      ___       _______   ________  ___________  _______        __
${yellow(`        ▓▓¿       `)}      /""\\    |"  |     /"     "| /"       )("     _   ")/"      \\      /""\\
${yellow(`       ▓▓▓▓Ç      `)}     /    \\   ||  |    (: ______)(:   \\___/  )__/  \\\\__/|:        |    /    \\
${yellow(`      ▓▓╝╙▓▓Ç     `)}    /' /\\  \\  |:  |     \\/    |   \\___  \\       \\\\_ /   |_____/   )   /' /\\  \\
${yellow(`     ▓▓╜  ╙▓▓╕    `)}   //  __'  \\  \\  |___  // ___)_   __/  \\\\      |.  |    //      /   //  __'  \\
${yellow(`    á╣╛    └▓╣╕   `)}  /   /  \\\\  \\( \\_|:  \\(:      "| /" \\   :)     \\:  |   |:  __   \\  /   /  \\\\  \\
${yellow(`   "▓╛  ▓▓⌐ "▓╜   `)} (___/    \\___)\\_______)\\_______)(_______/       \\__|   |__|  \\___)(___/    \\___)
${yellow(`      ┌▓▓▓▓╕      `)} ${VERSION.padStart(80, ' ')}
${yellow(`     ╓▓▓▓▓▓▓▄     `)} [${success}] Gateway
${yellow(`    Æ▓▓▓┘└▓▓▓▓    `)} [${Reflect.get(this.client, 'websocket') ? success : failed}] Evlyn Bridge
${yellow(`   ▓▓▓▓└  '▓▓▓▓,  `)}
${yellow(` ,▓╣╣▓      ╚╣╣▓┐ `)}
${yellow(` ╙▓▓▓W,     g▓▓▓▀ `)}
${yellow(`   └▓▓▓▓¿,φ▓▓▓└   `)}
${yellow(`     ,╚▓╣╣╣▓└     `)}
${yellow(`        ╙╜,       `)}`);
	}
}
