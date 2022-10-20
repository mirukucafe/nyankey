import { rejectFollowRequest } from '@/services/following/reject.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'write:following',

	errors: ['NO_SUCH_USER'],
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
	// Fetch follower
	const follower = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	await rejectFollowRequest(user, follower);

	return;
});
