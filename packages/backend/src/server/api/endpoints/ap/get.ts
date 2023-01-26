import { Resolver } from '@/remote/activitypub/resolver.js';
import { HOUR } from '@/const.js';
import define from '../../define.js';

export const meta = {
	tags: ['federation'],

	requireCredential: true,

	description: 'Tries to fetch the given `uri` from the remote server.',

	limit: {
		duration: HOUR,
		max: 30,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		uri: { type: 'string' },
	},
	required: ['uri'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const resolver = new Resolver();
	const object = await resolver.resolve(ps.uri, true);
	return object;
});
