import { UserGroupInvitations } from '@/models/index.js';
import define from '../../../../define.js';
import { ApiError } from '../../../../error.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Delete an existing group invitation for the authenticated user without joining the group.',

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

	await UserGroupInvitations.delete(invitation.id);
});
