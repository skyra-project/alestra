import { KlasaClient, KlasaClientOptions } from 'klasa';
import { Client as VezaClient } from 'veza';
import { IPCMonitorStore } from './structures/IPCMonitorStore';
import { Colors } from '@klasa/console';
import { mergeDefault } from '@klasa/utils';

const g = new Colors({ text: 'green' }).format('[IPC   ]');
const y = new Colors({ text: 'yellow' }).format('[IPC   ]');
const r = new Colors({ text: 'red' }).format('[IPC   ]');

export class AlestraClient extends KlasaClient {

	public ipcMonitors: IPCMonitorStore;
	public ipc = new VezaClient('alestra-master');

	public constructor(options: Partial<KlasaClientOptions> = {}) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		super(mergeDefault({ dev: false }, options));

		this.ipcMonitors = new IPCMonitorStore(this);
		this.registerStore(this.ipcMonitors);
		this.ipc
			.on('disconnect', client => { this.console.log(`${y} Disconnected: ${client.name}`); })
			.on('ready', client => { this.console.log(`${g} Ready ${client.name}`); })
			.on('error', (error, client) => { this.console.error(`${r} Error from ${client.name}`, error); })
			.on('message', this.ipcMonitors.run.bind(this.ipcMonitors));

		if (this.options.dev) this.permissionLevels.add(0, ({ author, client }) => client.options.owners.includes(author!.id), { 'break': true });
	}

}

declare module '@klasa/core/dist/src/lib/client/Client' {
	interface Client {
		ipcMonitors: IPCMonitorStore;
		ipc: VezaClient;
	}
	interface ClientOptions {
		dev?: boolean;
	}
}
