import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderFollow from '@/remote/activitypub/renderer/follow.js';
import renderAccept from '@/remote/activitypub/renderer/accept.js';
import { deliver } from '@/queue/index.js';
import { publishMainStream } from '@/services/stream.js';
import { User } from '@/models/entities/user.js';
import { FollowRequests, Users } from '@/models/index.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { insertFollowingDoc } from '../create.js';

/**
 * Accept a follow request from user `followee` to follow `follower`.
 * @param followee User who is being followed
 * @param follower User making the follow request
 */
export async function acceptFollowRequest(followee: User, follower: User): Promise<void> {
	const request = await FollowRequests.findOneBy({
		followeeId: followee.id,
		followerId: follower.id,
	});

	if (request == null) {
		throw new IdentifiableError('8884c2dd-5795-4ac9-b27e-6a01d38190f9', 'No follow request.');
	}

	await insertFollowingDoc(followee, follower);

	if (Users.isRemoteUser(follower) && Users.isLocalUser(followee)) {
		const content = renderActivity(renderAccept(renderFollow(follower, followee, request.requestId!), followee));
		deliver(followee, content, follower.inbox);
	}

	Users.pack(followee.id, followee, {
		detail: true,
	}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
}
