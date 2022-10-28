import { UserGroups } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['groups'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Delete an existing group.',

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
export default define(meta, paramDef, async (ps, user) => {
	const userGroup = await UserGroups.findOneBy({
		id: ps.groupId,
		userId: user.id,
	});

	if (userGroup == null) throw new ApiError('NO_SUCH_GROUP');

	await UserGroups.delete(userGroup.id);
});
