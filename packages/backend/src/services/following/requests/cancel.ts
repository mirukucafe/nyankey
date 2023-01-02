import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderFollow from '@/remote/activitypub/renderer/follow.js';
import renderUndo from '@/remote/activitypub/renderer/undo.js';
import { deliver } from '@/queue/index.js';
import { publishMainStream } from '@/services/stream.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { User } from '@/models/entities/user.js';
import { Users, FollowRequests } from '@/models/index.js';

/**
 * Cancel a follow request from `follower` to `followee`.
 * @param followee User that was going to be followed
 * @param follower User who is making the follow request
 */
export async function cancelFollowRequest(followee: User, follower: User): Promise<void> {
	if (Users.isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));

		if (Users.isLocalUser(follower)) {
			deliver(follower, content, followee.inbox);
		}
	}

	const requested = await FollowRequests.countBy({
		followeeId: followee.id,
		followerId: follower.id,
	});

	if (!requested) {
		throw new IdentifiableError('17447091-ce07-46dd-b331-c1fd4f15b1e7', 'request not found');
	}

	await FollowRequests.delete({
		followeeId: followee.id,
		followerId: follower.id,
	});

	Users.pack(followee.id, followee, {
		detail: true,
	}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
}
