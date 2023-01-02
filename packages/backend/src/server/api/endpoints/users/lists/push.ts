import { pushUserToUserList } from '@/services/user-list/push.js';
import { UserLists, UserListJoinings, Blockings } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';

export const meta = {
	tags: ['lists', 'users'],

	requireCredential: true,

	kind: 'write:account',

	description: 'Add a user to an existing list.',

	errors: ['ALREADY_ADDED', 'BLOCKED', 'NO_SUCH_USER', 'NO_SUCH_USER_LIST'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		listId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['listId', 'userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Fetch the list
	const userList = await UserLists.findOneBy({
		id: ps.listId,
		userId: me.id,
	});

	if (userList == null) throw new ApiError('NO_SUCH_USER_LIST');

	// Fetch the user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	// Check blocking
	if (user.id !== me.id) {
		const blocked = await Blockings.countBy({
			blockerId: user.id,
			blockeeId: me.id,
		});
		if (blocked) throw new ApiError('BLOCKED');
	}

	const exist = await UserListJoinings.countBy({
		userListId: userList.id,
		userId: user.id,
	});

	if (exist) throw new ApiError('ALREADY_ADDED');

	// Push the user
	await pushUserToUserList(user, userList);
});
