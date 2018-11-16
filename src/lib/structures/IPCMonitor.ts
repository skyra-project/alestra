import { Piece } from 'klasa';
import { AlestraClient } from '../AlestraClient';
import { IPCMonitorStore } from './IPCMonitorStore';

export abstract class IPCMonitor extends Piece {

	/**
	 * The Client that manages this instance
	 */
	public client: AlestraClient;

	/**
	 * The store that manages this instance
	 */
	// @ts-ignore
	public store: IPCMonitorStore;

	public abstract async run(message: any): Promise<any>;

}
