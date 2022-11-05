import * as crypto from 'node:crypto';
import { AuthSessions, AccessTokens, Apps } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { kinds } from '@/misc/api-permissions.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['auth'],

	requireCredential: true,

	secure: true,

	errors: ['NO_SUCH_SESSION'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		token: { type: 'string' },
		permission: {
			description: 'The permissions which the user wishes to grant in this token. '
			+ 'Permissions that the app has not registered before will be removed. '
			+ 'Defaults to all permissions the app was registered with if not provided.',
			type: 'array',
			uniqueItems: true,
			items: {
				type: 'string',
				enum: kinds,
			},
		},
	},
	required: ['token'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Fetch token
	const session = await AuthSessions
		.findOneBy({ token: ps.token });

	if (session == null) throw new ApiError('NO_SUCH_SESSION');

	// Generate access token
	const accessToken = secureRndstr(32, true);

	// Check for existing access token.
	const app = await Apps.findOneByOrFail({ id: session.appId });

	// Generate Hash
	const sha256 = crypto.createHash('sha256');
	sha256.update(accessToken + app.secret);
	const hash = sha256.digest('hex');

	const now = new Date();

	// Calculate the set intersection between requested permissions and
	// permissions that the app registered with. If no specific permissions
	// are given, grant all permissions the app registered with.
	const permission = ps.permission?.filter(x => app.permission.includes(x)) ?? app.permission;

	const accessTokenId = genId();

	// Insert access token doc
	await AccessTokens.insert({
		id: accessTokenId,
		createdAt: now,
		lastUsedAt: now,
		appId: session.appId,
		userId: user.id,
		token: accessToken,
		hash,
		permission,
	});

	// Update session
	await AuthSessions.update(session.id, { accessTokenId });
});
