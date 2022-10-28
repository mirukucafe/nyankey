import { resetDb } from '@/db/postgre.js';
import define from '../define.js';

export const meta = {
	tags: ['non-productive'],

	requireCredential: false,

	description: 'Only available when running with <code>NODE_ENV=testing</code>. Reset the database and flush Redis.',
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	if (process.env.NODE_ENV !== 'test') throw new Error('NODE_ENV is not a test');

	await resetDb();

	await new Promise(resolve => setTimeout(resolve, 1000));
});
