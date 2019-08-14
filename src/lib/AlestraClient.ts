import { Colors, KlasaClient, KlasaClientOptions, util } from 'klasa';
import { Client as VezaClient } from 'veza';
import { IPCMonitorStore } from './structures/IPCMonitorStore';

const g = new Colors({ text: 'green' }).format('[IPC   ]');
const y = new Colors({ text: 'yellow' }).format('[IPC   ]');
const r = new Colors({ text: 'red' }).format('[IPC   ]');

export class AlestraClient extends KlasaClient {

	public ipcMonitors = new IPCMonitorStore(this);
	public ipc = new VezaClient('alestra-master')
		.on('disconnect', client => { this.console.log(`${y} Disconnected: ${client.name}`); })
		.on('ready', client => { this.console.log(`${g} Ready ${client.name}`); })
		.on('error', (error, client) => { this.console.error(`${r} Error from ${client.name}`, error); })
		.on('message', this.ipcMonitors.run.bind(this.ipcMonitors));

	public constructor(options?: KlasaClientOptions) {
		super(util.mergeDefault({ dev: false }, options));

		this.registerStore(this.ipcMonitors);
		this.once('klasaReady', () => {
			if (this.options.dev) this.permissionLevels.add(0, ({ author, client }) => client.options.owners.includes(author!.id), { 'break': true });
		});
	}

}

declare module 'discord.js' {
	interface Client {
		ipcMonitors: IPCMonitorStore;
		ipc: VezaClient;
	}
	interface ClientOptions {
		dev?: boolean;
	}
}

declare module 'klasa' {

	interface PieceDefaults {
		ipcMonitors?: PieceOptions;
	}

}
