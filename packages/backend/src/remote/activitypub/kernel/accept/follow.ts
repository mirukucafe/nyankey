import { IRemoteUser } from '@/models/entities/user.js';
import { acceptFollowRequest } from '@/services/following/requests/accept.js';
import { relayAccepted } from '@/services/relay.js';
import { IFollow } from '@/remote/activitypub/type.js';
import { DbResolver } from '@/remote/activitypub/db-resolver.js';

export default async (actor: IRemoteUser, activity: IFollow): Promise<string> => {
	// activity is a follow request started by this server, so activity.actor must be an existing local user.

	const dbResolver = new DbResolver();
	const follower = await dbResolver.getUserFromApId(activity.actor);

	if (follower == null) {
		return 'skip: follower not found';
	}

	if (follower.host != null) {
		return 'skip: follower is not a local user';
	}

	// relay
	const match = activity.id?.match(/follow-relay\/(\w+)/);
	if (match) {
		return await relayAccepted(match[1]);
	}

	await acceptFollowRequest(actor, follower);
	return 'ok';
};
