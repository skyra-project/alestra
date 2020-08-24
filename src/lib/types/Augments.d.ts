import { IPCMonitorStore } from '@lib/structures/IPCMonitorStore';
import { Client as VezaClient } from 'veza';

declare module 'klasa' {
	export interface PieceOptions {}
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
