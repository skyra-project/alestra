import nodeFetch, { RequestInit, Response } from 'node-fetch';

export const enum FetchResultTypes {
	JSON,
	Buffer,
	Text,
	Result
}

export const enum FetchMethods {
	Post = 'POST',
	Get = 'GET',
	Put = 'PUT',
	Delete = 'DELETE'
}

export async function fetch(url: URL | string, type: FetchResultTypes.JSON): Promise<unknown>;
export async function fetch(url: URL | string, options: RequestInit, type: FetchResultTypes.JSON): Promise<unknown>;
export async function fetch(url: URL | string, type: FetchResultTypes.Buffer): Promise<Buffer>;
export async function fetch(url: URL | string, options: RequestInit, type: FetchResultTypes.Buffer): Promise<Buffer>;
export async function fetch(url: URL | string, type: FetchResultTypes.Text): Promise<string>;
export async function fetch(url: URL | string, options: RequestInit, type: FetchResultTypes.Text): Promise<string>;
export async function fetch(url: URL | string, type: FetchResultTypes.Result): Promise<Response>;
export async function fetch(url: URL | string, options: RequestInit, type: FetchResultTypes.Result): Promise<Response>;
export async function fetch(url: URL | string, options: RequestInit, type: FetchResultTypes): Promise<Response | Buffer | string | unknown>;
export async function fetch(url: URL | string, options: RequestInit | FetchResultTypes, type?: FetchResultTypes) {
	if (typeof options === 'undefined') {
		options = {};
		type = FetchResultTypes.JSON;
	} else if (typeof options === 'number') {
		type = options;
		options = {};
	} else if (typeof type === 'undefined') {
		type = FetchResultTypes.JSON;
	}

	const result: Response = await nodeFetch(url, options as RequestInit);
	if (!result.ok) throw new Error(await result.text());

	switch (type) {
		case FetchResultTypes.Result: return result;
		case FetchResultTypes.Buffer: return result.buffer();
		case FetchResultTypes.JSON: return result.json();
		case FetchResultTypes.Text: return result.text();
		default: throw new Error(`Unknown type ${type}`);
	}
}
