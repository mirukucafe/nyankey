import { v4 as uuid } from 'uuid';
import config from '@/config/index.js';
import { Apps, AuthSessions } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { compareUrl } from '@/server/api/common/compare-url.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
			url: {
				type: 'string',
				optional: false, nullable: false,
				format: 'url',
			},
			// stuff that auth/session/show would respond with
			id: {
				type: 'string',
				description: 'The ID of the authentication session. Same as returned by `auth/session/show`.',
				optional: false, nullable: false,
				format: 'id',
			},
			app: {
				type: 'object',
				description: 'The App requesting permissions. Same as returned by `auth/session/show`.',
				optional: false, nullable: false,
				ref: 'App',
			},
		},
	},

	errors: ['NO_SUCH_APP'],
} as const;

export const paramDef = {
	type: 'object',
	oneOf: [{
		properties: {
			clientId: { type: 'string' },
			callbackUrl: {
				type: 'string',
				minLength: 1,
			},
			pkceChallenge: {
				type: 'string',
				minLength: 1,
			},
		},
		required: ['clientId'],
	}, {
		properties: {
			appSecret: { type: 'string' },
		},
		required: ['appSecret'],
	}],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	// Lookup app
	const app = await Apps.findOneBy(ps.clientId ? {
		id: ps.clientId,
	} : {
		secret: ps.appSecret,
	});

	if (app == null) {
		throw new ApiError('NO_SUCH_APP');
	}

	// check URL if provided
	// technically the OAuth specification says that the redirect URI has to be
	// bound with the token request, but since an app may only register one
	// redirect URI, we don't actually have to store that.
	if (ps.callbackUrl && !compareUrl(app.callbackUrl, ps.callbackUrl)) {
		throw new ApiError('NO_SUCH_APP', 'redirect URI mismatch');
	}

	// Generate token
	const token = uuid();
	const id = genId();

	// Create session token document
	const doc = await AuthSessions.insert({
		id,
		createdAt: new Date(),
		appId: app.id,
		token,
		pkceChallenge: ps.pkceChallenge,
	}).then(x => AuthSessions.findOneByOrFail(x.identifiers[0]));

	return {
		token: doc.token,
		url: `${config.authUrl}/${doc.token}`,
		id,
		app: await Apps.pack(app),
	};
});
