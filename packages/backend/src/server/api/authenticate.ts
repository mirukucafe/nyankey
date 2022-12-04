import { CacheableLocalUser } from '@/models/entities/user.js';
import { Users, AccessTokens } from '@/models/index.js';
import { AccessToken } from '@/models/entities/access-token.js';
import { userByIdCache, localUserByNativeTokenCache } from '@/services/user-cache.js';
import isNativeToken from './common/is-native-token.js';

export class AuthenticationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthenticationError';
	}
}

export default async (authorization: string | null | undefined, bodyToken: string | null | undefined): Promise<[CacheableLocalUser | null | undefined, AccessToken | null | undefined]> => {
	let maybeToken: string | null = null;

	// check if there is an authorization header set
	if (authorization != null) {
		if (bodyToken != null) {
			throw new AuthenticationError('using multiple authorization schemes');
		}

		// check if OAuth 2.0 Bearer tokens are being used
		// Authorization schemes are case insensitive
		if (authorization.substring(0, 7).toLowerCase() === 'bearer ') {
			maybeToken = authorization.substring(7);
		} else {
			throw new AuthenticationError('unsupported authentication scheme');
		}
	} else if (bodyToken != null) {
		maybeToken = bodyToken;
	} else {
		return [null, null];
	}
	const token: string = maybeToken;

	if (isNativeToken(token)) {
		const user = await localUserByNativeTokenCache.fetch(token);

		if (user == null) {
			throw new AuthenticationError('unknown token');
		}

		return [user, null];
	} else {
		const accessToken = await AccessTokens.findOne({
			where: [{
				hash: token.toLowerCase(), // app
			}, {
				token, // miauth
			}],
		});

		if (accessToken == null) {
			throw new AuthenticationError('unknown token');
		}

		AccessTokens.update(accessToken.id, {
			lastUsedAt: new Date(),
		});

		const user = await userByIdCache.fetch(accessToken.userId);

		// can't authorize remote users
		if (!Users.isLocalUser(user)) return [null, null];

		return [user, accessToken];
	}
};
