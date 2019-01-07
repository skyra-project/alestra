import { Colors, KlasaClient, KlasaClientOptions, util } from 'klasa';
import { Node } from 'veza';
import { IPCMonitorStore } from './structures/IPCMonitorStore';

const g = new Colors({ text: 'green' }).format('[IPC   ]');
const y = new Colors({ text: 'yellow' }).format('[IPC   ]');
const r = new Colors({ text: 'red' }).format('[IPC   ]');

export class AlestraClient extends KlasaClient {

	public options: Required<AlestraClientOptions>;
	public ipcMonitors = new IPCMonitorStore(this);
	public ipc = new Node('alestra-master')
		.on('client.identify', (client) => { this.console.log(`${g} Client Connected: ${client.name}`); })
		.on('client.disconnect', (client) => { this.console.log(`${y} Client Disconnected: ${client.name}`); })
		.on('client.destroy', (client) => { this.console.log(`${y} Client Destroyed: ${client.name}`); })
		.on('server.ready', (server) => { this.console.log(`${g} Client Ready: Named ${server.name}`); })
		.on('error', (error, client) => { this.console.error(`${r} Error from ${client.name}`, error); })
		.on('message', this.ipcMonitors.run.bind(this.ipcMonitors));

	public constructor(options?: AlestraClientOptions) {
		super(util.mergeDefault({ dev: false }, options));

		this.registerStore(this.ipcMonitors);
		this.once('klasaReady', () => {
			if (this.options.dev) this.permissionLevels.add(0, ({ author, client }) => author.id === client.options.ownerID, { break: true });
		});
	}

}

/**
 * The client options for Alestra
 */
export type AlestraClientOptions = KlasaClientOptions & { dev?: boolean };
