import { URL } from 'node:url';
import { addRelay } from '@/services/relay.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: ['INVALID_URL'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			inbox: {
				description: 'URL of the inbox, must be a https scheme URL',
				type: 'string',
				optional: false, nullable: false,
				format: 'url',
			},
			status: {
				type: 'string',
				optional: false, nullable: false,
				default: 'requesting',
				enum: [
					'requesting',
					'accepted',
					'rejected',
				],
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		inbox: { type: 'string' },
	},
	required: ['inbox'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	try {
		if (new URL(ps.inbox).protocol !== 'https:') throw new ApiError('INVALID_URL', 'https only');
	} catch (e) {
		throw new ApiError('INVALID_URL', e);
	}

	return await addRelay(ps.inbox);
});
