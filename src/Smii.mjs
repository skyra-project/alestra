import { CLIENT_OPTIONS, TOKEN } from '../config.mjs';
import { Smii } from './index';

new Smii(CLIENT_OPTIONS).login(TOKEN);
