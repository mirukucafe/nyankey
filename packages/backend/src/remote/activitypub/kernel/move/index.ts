import { IsNull } from 'typeorm';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import { resolvePerson } from '@/remote/activitypub/models/person.js';
import { Followings, Users } from '@/models/index.js';
import { createNotification } from '@/services/create-notification.js';
import Resolver from '../../resolver.js';
import { IMove, isActor, getApId } from '../../type.js';

export async function move(actor: CacheableRemoteUser, activity: IMove, resolver: Resolver): Promise<void> {
	// actor is not move origin
	if (activity.object == null || getApId(activity.object) !== actor.uri) return;

	// actor already moved
	if (actor.movedTo != null) return;

	// no move target
	if (activity.target == null) return;

	/* the database resolver can not be used here, because:
	 * 1. It must be ensured that the latest data is used.
	 * 2. The AP representation is needed, because `alsoKnownAs`
	 *    is not stored in the database.
	 * This also checks whether the move target is blocked
	 */
	const movedToAp = await resolver.resolve(getApId(activity.target));

	// move target is not an actor
	if (!isActor(movedToAp)) return;

	// move destination has not accepted
	if (!Array.isArray(movedToAp.alsoKnownAs) || !movedToAp.alsoKnownAs.includes(actor.id)) return;

	// ensure the user exists
	const movedTo = await resolvePerson(getApId(activity.target), resolver, movedToAp);
	// move target is already suspended
	if (movedTo.isSuspended) return;

	// process move for local followers
	const followings = Followings.find({
		select: {
			followerId: true,
		},
		where: {
			followeeId: actor.id,
			followerHost: IsNull(),
		},
	});

	await Promise.all([
		Users.update(actor.id, {
			movedToId: movedTo.id,
		}),
		...followings.map(async (following) => {
			// TODO: autoAcceptMove?

			await createNotification(following.followerId, 'move', {
				notifierId: actor.id,
				moveTargetId: movedTo.id,
			});
		}),
	]);
}
