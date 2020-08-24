import { Constructor, Store } from '@klasa/core';
import { AlestraClient } from '@lib/AlestraClient';
import { NodeMessage } from 'veza';
import { IPCMonitor } from './IPCMonitor';

export class IPCMonitorStore extends Store<IPCMonitor> {
	public constructor(client: AlestraClient) {
		super(client, 'ipcMonitors', IPCMonitor as Constructor<IPCMonitor>);
	}

	public async run(message: NodeMessage): Promise<void> {
		if (!Array.isArray(message.data) || message.data.length === 0 || message.data.length > 2) {
			if (message.data) this.client.console.wtf('Invalid Payload', message.data);
			message.reply([0, 'INVALID_PAYLOAD']);
			return;
		}

		const [route, payload = null] = message.data as [string, unknown];
		const monitor = this.get(route);
		if (!monitor) {
			message.reply([0, 'UNKNOWN_ROUTE']);
			return;
		}

		try {
			const result = await monitor.run(payload);
			message.reply([1, result]);
		} catch (error) {
			message.reply([0, error]);
		}
	}
}
