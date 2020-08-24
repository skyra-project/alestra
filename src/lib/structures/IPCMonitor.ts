import { Piece } from '@klasa/core';

export abstract class IPCMonitor extends Piece {
	public abstract run(message: unknown): unknown;
}
