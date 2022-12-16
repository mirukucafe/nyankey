import { rmSync } from 'fs';
import { __dirname } from './common.mjs';

export const files = [
	'/../packages/backend/built',
	'/../packages/backend/tsconfig.tsbuildinfo',
	'/../packages/client/built',
	'/../packages/foundkey-js/built',
	'/../packages/sw/built',
	'/../built',
];

export function clean(filename) {
	rmSync(__dirname + filename, { recursive: true, force: true });
}

for (const file of files) {
	clean(file);
}
