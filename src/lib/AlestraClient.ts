import { Colors } from '@klasa/console';
import { mergeDefault } from '@klasa/utils';
import { IPCMonitorStore } from '@lib/structures/IPCMonitorStore';
import { KlasaClient, KlasaClientOptions } from 'klasa';
import { Client as VezaClient } from 'veza';

const g = new Colors({ text: 'green' }).format('[IPC   ]');
const y = new Colors({ text: 'yellow' }).format('[IPC   ]');
const r = new Colors({ text: 'red' }).format('[IPC   ]');

export class AlestraClient extends KlasaClient {
	public ipcMonitors: IPCMonitorStore;
	public ipc = new VezaClient('alestra-main');

	public constructor(options: Partial<KlasaClientOptions> = {}) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		super(mergeDefault({ dev: false }, options));

		this.ipcMonitors = new IPCMonitorStore(this);
		this.registerStore(this.ipcMonitors);
		this.ipc
			.on('disconnect', (client) => {
				this.console.log(`${y} Disconnected: ${client.name}`);
			})
			.on('ready', (client) => {
				this.console.log(`${g} Ready ${client.name}`);
			})
			.on('error', (error, client) => {
				this.console.error(`${r} Error from ${client.name}`, error);
			})
			.on('message', this.ipcMonitors.run.bind(this.ipcMonitors));
	}
}
