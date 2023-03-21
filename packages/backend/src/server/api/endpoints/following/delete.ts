import deleteFollowing from '@/services/following/delete.js';
import { Followings, Users } from '@/models/index.js';
import { HOUR } from '@/const.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';
import { getUser } from '@/server/api/common/getters.js';

export const meta = {
	tags: ['following', 'users'],

	limit: {
		duration: HOUR,
		max: 100,
	},

	requireCredential: true,

	kind: 'write:following',

	errors: ['FOLLOWEE_IS_YOURSELF', 'NO_SUCH_USER', 'NOT_FOLLOWING'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserLite',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const follower = user;

	// Check if the followee is yourself
	if (user.id === ps.userId) throw new ApiError('FOLLOWEE_IS_YOURSELF');

	// Get followee
	const followee = await getUser(ps.userId);

	// Check not following
	const exist = await Followings.countBy({
		followerId: follower.id,
		followeeId: followee.id,
	});

	if (!exist) throw new ApiError('NOT_FOLLOWING');

	await deleteFollowing(follower, followee);

	return await Users.pack(followee.id, user);
});
