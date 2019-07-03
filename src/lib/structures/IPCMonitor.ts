import { Piece } from 'klasa';
import { IPCMonitorStore } from './IPCMonitorStore';
import { AlestraClient } from '../AlestraClient';

export abstract class IPCMonitor extends Piece {

	public client!: AlestraClient;

	/**
	 * The store that manages this instance
	 */
	// @ts-ignore
	public store!: IPCMonitorStore;

	public abstract async run(message: any): Promise<any>;

}
