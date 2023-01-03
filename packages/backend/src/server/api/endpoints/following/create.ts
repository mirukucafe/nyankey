import create from '@/services/following/create.js';
import { Followings, Users } from '@/models/index.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
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

	errors: ['ALREADY_FOLLOWING', 'BLOCKING', 'BLOCKED', 'FOLLOWEE_IS_YOURSELF', 'NO_SUCH_USER'],

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

	// 自分自身
	if (user.id === ps.userId) throw new ApiError('FOLLOWEE_IS_YOURSELF');

	// Get followee
	const followee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	// Check if already following
	const exist = await Followings.countBy({
		followerId: follower.id,
		followeeId: followee.id,
	});

	if (exist) throw new ApiError('ALREADY_FOLLOWING');

	try {
		await create(follower, followee);
	} catch (e) {
		if (e instanceof IdentifiableError) {
			if (e.id === '710e8fb0-b8c3-4922-be49-d5d93d8e6a6e') throw new ApiError('BLOCKING');
			if (e.id === '3338392a-f764-498d-8855-db939dcf8c48') throw new ApiError('BLOCKED');
		}
		throw e;
	}

	return await Users.pack(followee.id, user);
});
