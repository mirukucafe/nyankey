import unfollow from '@/services/following/delete.js';
import cancelRequest from '@/services/following/requests/cancel.js';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import { FollowRequests, Followings } from '@/models/index.js';
import { IFollow } from '@/remote/activitypub/type.js';
import { DbResolver } from '@/remote/activitypub/db-resolver.js';

export default async (actor: CacheableRemoteUser, activity: IFollow): Promise<string> => {
	const dbResolver = new DbResolver();

	const followee = await dbResolver.getUserFromApId(activity.object);
	if (followee == null) {
		return 'skip: followee not found';
	}

	if (followee.host != null) {
		return 'skip: the unfollowed user is not local';
	}

	const [req, following] = await Promise.all([
		FollowRequests.findOneBy({
			followerId: actor.id,
			followeeId: followee.id,
		}),
		Followings.findOneBy({
			followerId: actor.id,
			followeeId: followee.id,
		}),
	]);

	if (req) {
		await cancelRequest(followee, actor);
		return 'ok: follow request canceled';
	} else if (following) {
		await unfollow(actor, followee);
		return 'ok: unfollowed';
	} else {
		return 'skip: no such following or follow request';
	}
};
