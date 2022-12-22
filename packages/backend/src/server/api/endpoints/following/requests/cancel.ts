import { cancelFollowRequest } from '@/services/following/requests/cancel.js';
import { Users } from '@/models/index.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'write:following',

	errors: ['NO_SUCH_USER', 'NO_SUCH_FOLLOW_REQUEST'],

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
	// Fetch followee
	const followee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	try {
		await cancelFollowRequest(followee, user);
	} catch (e) {
		if (e instanceof IdentifiableError) {
			if (e.id === '17447091-ce07-46dd-b331-c1fd4f15b1e7') throw new ApiError('NO_SUCH_FOLLOW_REQUEST');
		}
		throw e;
	}

	return await Users.pack(followee.id, user);
});
