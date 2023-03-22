import { IsNull } from 'typeorm';
import { CacheableLocalUser, ILocalUser, User } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import { Cache } from '@/misc/cache.js';
import { subscriber } from '@/db/redis.js';

export const userByIdCache = new Cache<User>(
	Infinity,
	async (id) => await Users.findOneBy({ id, isDeleted: false }) ?? undefined,
);
export const localUserByNativeTokenCache = new Cache<CacheableLocalUser>(
	Infinity,
	async (token) => await Users.findOneBy({ token, host: IsNull(), isDeleted: false }) as ILocalUser | null ?? undefined,
);
export const uriPersonCache = new Cache<User>(
	Infinity,
	async (uri) => await Users.findOneBy({ uri, isDeleted: false }) ?? undefined,
);

subscriber.on('message', async (_, data) => {
	const obj = JSON.parse(data);

	if (obj.channel === 'internal') {
		const { type, body } = obj.message;
		switch (type) {
			case 'userChangeSuspendedState':
			case 'userChangeSilencedState':
			case 'userChangeModeratorState':
			case 'remoteUserUpdated': {
				const user = await Users.findOneByOrFail({ id: body.id });
				if (user.isDeleted) {
					userByIdCache.delete(user.id);
					uriPersonCache.delete(user.uri);
					if (Users.isLocalUser(user)) {
						localUserByNativeTokenCache.delete(user.token);
					}
				} else {
					userByIdCache.set(user.id, user);
					uriPersonCache.set(user.uri, user);
					if (Users.isLocalUser(user)) {
						localUserByNativeTokenCache.set(user.token, user);
					}
				}
				break;
			}
			case 'userTokenRegenerated': {
				const user = await Users.findOneByOrFail({ id: body.id }) as ILocalUser;
				localUserByNativeTokenCache.delete(body.oldToken);
				localUserByNativeTokenCache.set(body.newToken, user);
				break;
			}
		}
	}
});
