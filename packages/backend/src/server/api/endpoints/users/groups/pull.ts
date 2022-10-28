import { UserGroups, UserGroupJoinings } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Removes a specified user from a group. The owner can not be removed.',

	errors: ['NO_SUCH_USER', 'NO_SUCH_GROUP', 'GROUP_OWNER'],
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

	if (user.id === userGroup.userId) throw new ApiError('GROUP_OWNER');

	// Pull the user
	await UserGroupJoinings.delete({ userGroupId: userGroup.id, userId: user.id });
});
