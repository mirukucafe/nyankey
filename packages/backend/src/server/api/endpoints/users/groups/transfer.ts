import { UserGroups, UserGroupJoinings } from '@/models/index.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';
import { getUser } from '@/server/api/common/getters.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Transfer ownership of a group from the authenticated user to another user.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserGroup',
	},

	errors: ['NO_SUCH_GROUP', 'NO_SUCH_USER'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		groupId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['groupId', 'userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Fetch the group
	const userGroup = await UserGroups.findOneBy({
		id: ps.groupId,
		userId: me.id,
	});

	if (userGroup == null) throw new ApiError('NO_SUCH_GROUP');

	// Fetch the user
	const user = await getUser(ps.userId);

	const joined = await UserGroupJoinings.countBy({
		userGroupId: userGroup.id,
		userId: user.id,
	});

	if (!joined) throw new ApiError('NO_SUCH_USER', 'The user exists but is not a member of the group.');

	await UserGroups.update(userGroup.id, {
		userId: ps.userId,
	});

	return await UserGroups.pack(userGroup.id);
});
