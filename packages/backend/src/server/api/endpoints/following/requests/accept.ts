import { acceptFollowRequest } from '@/services/following/requests/accept.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'write:following',

	errors: ['NO_SUCH_USER', 'NO_SUCH_FOLLOW_REQUEST'],
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

	await acceptFollowRequest(user, follower).catch(e => {
		if (e.id === '8884c2dd-5795-4ac9-b27e-6a01d38190f9') throw new ApiError('NO_SUCH_FOLLOW_REQUEST');
		throw e;
	});

	return;
});
