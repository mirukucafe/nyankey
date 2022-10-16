import renderUpdate from '@/remote/activitypub/renderer/update.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import { Users } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { renderPerson } from '@/remote/activitypub/renderer/person.js';
import { deliverToFollowers } from '@/remote/activitypub/deliver-manager.js';
import { deliverToRelays } from '../relay.js';

/**
 * Send an Update activity to a user's followers.
 * @param userId ID of user
 */
export async function publishToFollowers(userId: User['id']): Promise<void> {
	const user = await Users.findOneBy({ id: userId });
	if (user == null) throw new Error('user not found');

	// Deliver Update if the follower is a remote user and the poster is a local user
	if (Users.isLocalUser(user)) {
		const content = renderActivity(renderUpdate(await renderPerson(user), user));
		deliverToFollowers(user, content);
		deliverToRelays(user, content);
	}
}
