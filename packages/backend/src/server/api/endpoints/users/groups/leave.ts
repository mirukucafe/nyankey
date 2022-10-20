import { UserGroups, UserGroupJoinings } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Leave a group. The owner of a group can not leave. They must transfer ownership or delete the group instead.',

	errors: ['NO_SUCH_GROUP', 'GROUP_OWNER'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		groupId: { type: 'string', format: 'misskey:id' },
	},
	required: ['groupId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Fetch the group
	const userGroup = await UserGroups.findOneBy({
		id: ps.groupId,
	});

	if (userGroup == null) throw new ApiError('NO_SUCH_GROUP');

	if (me.id === userGroup.userId) throw new ApiError('GROUP_OWNER');

	await UserGroupJoinings.delete({ userGroupId: userGroup.id, userId: me.id });
});
