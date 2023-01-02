import { Brackets } from 'typeorm';
import { MessagingMessages, UserGroups, UserGroupJoinings, Users } from '@/models/index.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { readUserMessagingMessage, readGroupMessagingMessage, deliverReadActivity } from '../../common/read-messaging-message.js';

export const meta = {
	tags: ['messaging'],

	requireCredential: true,

	kind: 'read:messaging',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'MessagingMessage',
		},
	},

	errors: ['ACCESS_DENIED', 'NO_SUCH_USER', 'NO_SUCH_GROUP'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		markAsRead: { type: 'boolean', default: true },
	},
	anyOf: [
		{
			properties: {
				userId: { type: 'string', format: 'misskey:id' },
			},
			required: ['userId'],
		},
		{
			properties: {
				groupId: { type: 'string', format: 'misskey:id' },
			},
			required: ['groupId'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	if (ps.userId != null) {
		// Fetch recipient (user)
		const recipient = await getUser(ps.userId).catch(e => {
			if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
			throw e;
		});

		const query = makePaginationQuery(MessagingMessages.createQueryBuilder('message'), ps.sinceId, ps.untilId)
			.andWhere(new Brackets(qb => { qb
				.where(new Brackets(qb => { qb
					.where('message.userId = :meId')
					.andWhere('message.recipientId = :recipientId');
				}))
				.orWhere(new Brackets(qb => { qb
					.where('message.userId = :recipientId')
					.andWhere('message.recipientId = :meId');
				}));
			}))
			.setParameter('meId', user.id)
			.setParameter('recipientId', recipient.id);

		const messages = await query.take(ps.limit).getMany();

		// Mark all as read
		if (ps.markAsRead) {
			readUserMessagingMessage(user.id, recipient.id, messages.filter(m => m.recipientId === user.id).map(x => x.id));

			// リモートユーザーとのメッセージだったら既読配信
			if (Users.isLocalUser(user) && Users.isRemoteUser(recipient)) {
				deliverReadActivity(user, recipient, messages);
			}
		}

		return await Promise.all(messages.map(message => MessagingMessages.pack(message, user, {
			populateRecipient: false,
		})));
	} else if (ps.groupId != null) {
		// Fetch recipient (group)
		const recipientGroup = await UserGroups.findOneBy({ id: ps.groupId });

		if (recipientGroup == null) throw new ApiError('NO_SUCH_GROUP');

		// check joined
		const joined = await UserGroupJoinings.countBy({
			userId: user.id,
			userGroupId: recipientGroup.id,
		});

		if (!joined) throw new ApiError('ACCESS_DENIED', 'You have to join a group to read messages in it.');

		const query = makePaginationQuery(MessagingMessages.createQueryBuilder('message'), ps.sinceId, ps.untilId)
			.andWhere('message.groupId = :groupId', { groupId: recipientGroup.id });

		const messages = await query.take(ps.limit).getMany();

		// Mark all as read
		if (ps.markAsRead) {
			readGroupMessagingMessage(user.id, recipientGroup.id, messages.map(x => x.id));
		}

		return await Promise.all(messages.map(message => MessagingMessages.pack(message, user, {
			populateGroup: false,
		})));
	}
});
