import { UserGroups, UserGroupJoinings, UserGroupInvitations } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { UserGroupInvitation } from '@/models/entities/user-group-invitation.js';
import { createNotification } from '@/services/create-notification.js';
import { getUser } from '../../../common/getters.js';
import { ApiError } from '../../../error.js';
import define from '../../../define.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Invite a user to an existing group.',

	errors: ['NO_SUCH_USER', 'NO_SUCH_GROUP', 'ALREADY_ADDED', 'ALREADY_INVITED'],
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

	if (joined) throw new ApiError('ALREADY_ADDED');

	const existInvitation = await UserGroupInvitations.countBy({
		userGroupId: userGroup.id,
		userId: user.id,
	});

	if (existInvitation) throw new ApiError('ALREADY_INVITED');

	const invitation = await UserGroupInvitations.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		userGroupId: userGroup.id,
	} as UserGroupInvitation).then(x => UserGroupInvitations.findOneByOrFail(x.identifiers[0]));

	// 通知を作成
	createNotification(user.id, 'groupInvited', {
		notifierId: me.id,
		userGroupInvitationId: invitation.id,
	});
});
