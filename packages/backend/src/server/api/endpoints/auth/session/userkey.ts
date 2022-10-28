import { Apps, AuthSessions, AccessTokens, Users } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			accessToken: {
				type: 'string',
				optional: false, nullable: false,
			},

			user: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'UserDetailedNotMe',
			},
		},
	},

	errors: ['NO_SUCH_APP', 'NO_SUCH_SESSION', 'PENDING_SESSION'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		appSecret: { type: 'string' },
		token: { type: 'string' },
	},
	required: ['appSecret', 'token'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	// Lookup app
	const app = await Apps.findOneBy({
		secret: ps.appSecret,
	});

	if (app == null) throw new ApiError('NO_SUCH_APP');

	// Fetch token
	const session = await AuthSessions.findOneBy({
		token: ps.token,
		appId: app.id,
	});

	if (session == null) throw new ApiError('NO_SUCH_SESSION');

	if (session.userId == null) throw new ApiError('PENDING_SESSION');

	// Lookup access token
	const accessToken = await AccessTokens.findOneByOrFail({
		appId: app.id,
		userId: session.userId,
	});

	// Delete session
	AuthSessions.delete(session.id);

	return {
		accessToken: accessToken.token,
		user: await Users.pack(session.userId, null, {
			detail: true,
		}),
	};
});
