import { UserGroupJoinings, UserGroupInvitations } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { UserGroupJoining } from '@/models/entities/user-group-joining.js';
import { ApiError } from '../../../../error.js';
import define from '../../../../define.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Join a group the authenticated user has been invited to.',

	errors: ['NO_SUCH_INVITATION'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		invitationId: { type: 'string', format: 'misskey:id' },
	},
	required: ['invitationId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Fetch the invitation
	const invitation = await UserGroupInvitations.findOneBy({
		id: ps.invitationId,
		userId: user.id,
	});

	if (invitation == null) throw new ApiError('NO_SUCH_INVITATION');

	// Push the user
	await UserGroupJoinings.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		userGroupId: invitation.userGroupId,
	} as UserGroupJoining);

	UserGroupInvitations.delete(invitation.id);
});
