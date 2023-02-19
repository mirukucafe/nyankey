import deleteFollowing from '@/services/following/delete.js';
import { Users, Followings, Notifications } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { ApiError } from '@/server/api/error.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';
import { doPostSuspend } from '@/services/suspend-user.js';
import { publishUserEvent } from '@/services/stream.js';
import define from '../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: ['NO_SUCH_USER', 'IS_ADMIN', 'IS_MODERATOR'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const user = await Users.findOneBy({ id: ps.userId });

	if (user == null) {
		throw new ApiError('NO_SUCH_USER');
	} else if (user.isAdmin) {
		throw new ApiError('IS_ADMIN');
	} else if (user.isModerator) {
		throw new ApiError('IS_MODERATOR');
	}

	await Users.update(user.id, {
		isSuspended: true,
	});

	insertModerationLog(me, 'suspend', {
		targetId: user.id,
	});

	// Terminate streaming
	if (Users.isLocalUser(user)) {
		publishUserEvent(user.id, 'terminate', {});
	}

	(async () => {
		await doPostSuspend(user).catch(() => {});
		await unFollowAll(user).catch(() => {});
		await readAllNotify(user).catch(() => {});
	})();
});

async function unFollowAll(follower: User) {
	const followings = await Followings.findBy({
		followerId: follower.id,
	});

	for (const following of followings) {
		const followee = await Users.findOneBy({
			id: following.followeeId,
		});

		if (followee == null) {
			throw new Error(`Cant find followee ${following.followeeId}`);
		}

		await deleteFollowing(follower, followee, true);
	}
}

async function readAllNotify(notifier: User) {
	await Notifications.update({
		notifierId: notifier.id,
		isRead: false,
	}, {
		isRead: true,
	});
}
