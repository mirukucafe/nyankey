import { IRemoteUser } from '@/models/entities/user.js';
import { remoteReject } from '@/services/following/reject.js';
import { relayRejected } from '@/services/relay.js';
import { Users } from '@/models/index.js';
import { IFollow } from '../../type.js';
import { DbResolver } from '../../db-resolver.js';

export default async (actor: IRemoteUser, activity: IFollow): Promise<string> => {
	// activity is a follow request started by this server, so activity.actor must be an existing local user.

	const dbResolver = new DbResolver();
	const follower = await dbResolver.getUserFromApId(activity.actor);

	if (follower == null) {
		return 'skip: follower not found';
	}

	if (!Users.isLocalUser(follower)) {
		return 'skip: follower is not a local user';
	}

	// relay
	const match = activity.id?.match(/follow-relay\/(\w+)/);
	if (match) {
		return await relayRejected(match[1]);
	}

	await remoteReject(actor, follower);
	return 'ok';
};
