import { UserGroups, UserGroupJoinings } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';

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
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

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
