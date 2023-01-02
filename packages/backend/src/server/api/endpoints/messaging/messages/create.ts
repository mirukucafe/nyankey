import { DriveFiles, UserGroups, UserGroupJoinings, Blockings } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { UserGroup } from '@/models/entities/user-group.js';
import { createMessage } from '@/services/messages/create.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';

export const meta = {
	tags: ['messaging'],

	requireCredential: true,

	kind: 'write:messaging',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MessagingMessage',
	},

	errors: ['ACCESS_DENIED', 'BLOCKED', 'NO_SUCH_FILE', 'NO_SUCH_USER', 'NO_SUCH_GROUP', 'RECIPIENT_IS_YOURSELF'],
} as const;

export const paramDef = {
	type: 'object',
	anyOf: [
		{
			properties: {
				text: {
					type: 'string',
					minLength: 1,
					maxLength: 3000,
				},
				fileId: {
					type: 'string',
					format: 'misskey:id',
				},
				userId: {
					type: 'string',
					format: 'misskey:id',
				},
			},
			required: ['text', 'userId'],
		},
		{
			properties: {
				fileId: {
					type: 'string',
					format: 'misskey:id',
				},
				userId: {
					type: 'string',
					format: 'misskey:id',
				},
			},
			required: ['fileId', 'userId'],
		},
		{
			properties: {
				text: {
					type: 'string',
					minLength: 1,
					maxLength: 3000,
				},
				fileId: {
					type: 'string',
					format: 'misskey:id',
				},
				groupId: {
					type: 'string',
					format: 'misskey:id',
				},
			},
			required: ['text', 'groupId'],
		},
		{
			properties: {
				fileId: {
					type: 'string',
					format: 'misskey:id',
				},
				groupId: {
					type: 'string',
					format: 'misskey:id',
				},
			},
			required: ['fileId', 'groupId'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let recipientUser: User | null;
	let recipientGroup: UserGroup | null;

	if (ps.userId != null) {
		// Myself
		if (ps.userId === user.id) throw new ApiError('RECIPIENT_IS_YOURSELF');

		// Fetch recipient (user)
		recipientUser = await getUser(ps.userId).catch(e => {
			if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
			throw e;
		});

		// Check blocking
		const block = await Blockings.countBy({
			blockerId: recipientUser.id,
			blockeeId: user.id,
		});
		if (block) throw new ApiError('BLOCKED');
	} else if (ps.groupId != null) {
		// Fetch recipient (group)
		recipientGroup = await UserGroups.findOneBy({ id: ps.groupId! });

		if (recipientGroup == null) throw new ApiError('NO_SUCH_GROUP');

		// check joined
		const joined = await UserGroupJoinings.countBy({
			userId: user.id,
			userGroupId: recipientGroup.id,
		});

		if (!joined) throw new ApiError('ACCESS_DENIED', 'You have to join a group to send a message in it.');
	}

	let file = null;
	if (ps.fileId != null) {
		file = await DriveFiles.findOneBy({
			id: ps.fileId,
			userId: user.id,
		});

		if (file == null) throw new ApiError('NO_SUCH_FILE');
	}

	return await createMessage(user, recipientUser, recipientGroup, ps.text, file);
});
