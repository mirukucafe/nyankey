import { Users } from '@/models/index.js';
import { ApiError } from '@/server/api/error.js';
import { deleteAccount } from '@/services/delete-account.js';
import define from '../../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,

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
export default define(meta, paramDef, async (ps) => {
	const user = await Users.findOneBy({
		id: ps.userId,
		isDeleted: false,
	});

	if (user == null) {
		throw new ApiError('NO_SUCH_USER');
	} else if (user.isAdmin) {
		throw new ApiError('IS_ADMIN');
	} else if (user.isModerator) {
		throw new ApiError('IS_MODERATOR');
	}

	await deleteAccount(user);
});
