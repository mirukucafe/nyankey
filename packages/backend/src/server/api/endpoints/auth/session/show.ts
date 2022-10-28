import { AuthSessions } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	errors: ['NO_SUCH_SESSION'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			app: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'App',
			},
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		token: { type: 'string' },
	},
	required: ['token'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Lookup session
	const session = await AuthSessions.findOneBy({
		token: ps.token,
	});

	if (session == null) throw new ApiError('NO_SUCH_SESSION');

	return await AuthSessions.pack(session, user);
});
