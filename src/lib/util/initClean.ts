import { TOKEN } from '../../../config';
import { initClean } from './clean';

const raw = [TOKEN].filter(value => typeof value === 'string' && value !== '');

initClean([...new Set(raw)]);
