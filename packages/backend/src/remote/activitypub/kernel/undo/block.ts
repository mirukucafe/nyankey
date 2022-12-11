import unblock from '@/services/blocking/delete.js';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import { IBlock } from '@/remote/activitypub/type.js';
import { DbResolver } from '@/remote/activitypub/db-resolver.js';

export default async (actor: CacheableRemoteUser, activity: IBlock): Promise<string> => {
	const dbResolver = new DbResolver();
	const blockee = await dbResolver.getUserFromApId(activity.object);

	if (blockee == null) {
		return 'skip: blockee not found';
	}

	if (blockee.host != null) {
		return 'skip: ブロック解除しようとしているユーザーはローカルユーザーではありません';
	}

	await unblock(await Users.findOneByOrFail({ id: actor.id }), blockee);
	return 'ok';
};
