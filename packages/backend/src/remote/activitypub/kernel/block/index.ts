import block from '@/services/blocking/create.js';
import { IRemoteUser } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import { DbResolver } from '@/remote/activitypub/db-resolver.js';
import { IBlock } from '@/remote/activitypub/type.js';

export default async (actor: IRemoteUser, activity: IBlock): Promise<string> => {
	// There is a block target in activity.object, which should be a local user that exists.

	const dbResolver = new DbResolver();
	const blockee = await dbResolver.getUserFromApId(activity.object);

	if (blockee == null) {
		return 'skip: blockee not found';
	}

	if (blockee.host != null) {
		return 'skip: blockee is not local';
	}

	await block(await Users.findOneByOrFail({ id: actor.id }), await Users.findOneByOrFail({ id: blockee.id }));
	return 'ok';
};
