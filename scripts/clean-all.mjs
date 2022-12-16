import { files, clean } from './clean.mjs';

const allFiles = [
	...files,
	'/../packages/backend/node_modules',
	'/../packages/client/node_modules',
	'/../packages/foundkey-js/node_modules',
	'/../packages/sw/node_modules',
	'/../node_modules',
];

for (const file of allFiles) {
	clean(file);
}
