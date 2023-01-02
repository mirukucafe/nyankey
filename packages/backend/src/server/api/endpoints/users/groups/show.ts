import { UserGroups, UserGroupJoinings } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['groups', 'account'],

	requireCredential: true,

	kind: 'read:user-groups',

	description: 'Show the properties of a group.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserGroup',
	},

	errors: ['NO_SUCH_GROUP'],
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

	const joined = await UserGroupJoinings.countBy({
		userId: me.id,
		userGroupId: userGroup.id,
	});

	if (!joined && userGroup.userId !== me.id) {
		throw new ApiError('NO_SUCH_GROUP');
	}

	return await UserGroups.pack(userGroup);
});
