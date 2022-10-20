import * as crypto from 'node:crypto';
import { AuthSessions, AccessTokens, Apps } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
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

	// Fetch exist access token
	const exist = await AccessTokens.findOneBy({
		appId: session.appId,
		userId: user.id,
	});

	if (exist == null) {
		// Lookup app
		const app = await Apps.findOneByOrFail({ id: session.appId });

		// Generate Hash
		const sha256 = crypto.createHash('sha256');
		sha256.update(accessToken + app.secret);
		const hash = sha256.digest('hex');

		const now = new Date();

		// Insert access token doc
		await AccessTokens.insert({
			id: genId(),
			createdAt: now,
			lastUsedAt: now,
			appId: session.appId,
			userId: user.id,
			token: accessToken,
			hash,
		});
	}

	// Update session
	await AuthSessions.update(session.id, {
		userId: user.id,
	});
});
