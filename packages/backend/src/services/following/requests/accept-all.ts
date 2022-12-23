import { User } from '@/models/entities/user.js';
import { FollowRequests, Users } from '@/models/index.js';
import { acceptFollowRequest } from './accept.js';

/**
 * Approve all follow requests addressed to the specified user.
 * @param user The user whom to accept all follow requests to
 */
export async function acceptAllFollowRequests(user: User): Promise<void> {
	const requests = await FollowRequests.findBy({
		followeeId: user.id,
	});

	for (const request of requests) {
		const follower = await Users.findOneByOrFail({ id: request.followerId });
		acceptFollowRequest(user, follower);
	}
}
