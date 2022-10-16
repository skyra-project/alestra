import type { ArrayString, BooleanString, NumberString } from '@skyra/env-utilities';

declare module '@skyra/env-utilities' {
	export interface Env {
		PM2_HOME: string;

		EVLYN_HOST: string;
		EVLYN_PORT: NumberString;

		CLIENT_OWNERS: ArrayString;
		CLIENT_PREFIX: string;
		CLIENT_VERSION: string;

		CLIENT_PRESENCE_NAME: string;
		CLIENT_PRESENCE_TYPE: string;

		CLIENT_TOKEN: string;
	}
}
