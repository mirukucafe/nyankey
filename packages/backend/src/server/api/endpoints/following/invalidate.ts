import deleteFollowing from '@/services/following/delete.js';
import { Followings, Users } from '@/models/index.js';
import { HOUR } from '@/const.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';

export const meta = {
	tags: ['following', 'users'],

	limit: {
		duration: HOUR,
		max: 100,
	},

	requireCredential: true,

	kind: 'write:following',

	errors: ['FOLLOWER_IS_YOURSELF', 'NO_SUCH_USER', 'NOT_FOLLOWING'],

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
	const followee = user;

	// Check if the follower is yourself
	if (user.id === ps.userId) throw new ApiError('FOLLOWER_IS_YOURSELF');

	// Get follower
	const follower = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	// Check not following
	const exist = await Followings.countBy({
		followerId: follower.id,
		followeeId: followee.id,
	});

	if (!exist) throw new ApiError('NOT_FOLLOWING');

	await deleteFollowing(follower, followee);

	return await Users.pack(followee.id, user);
});
