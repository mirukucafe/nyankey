import { FindOptionsWhere, In, IsNull } from 'typeorm';
import { resolveUser } from '@/remote/resolve-user.js';
import { Users } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import define from '../../define.js';
import { apiLogger } from '../../logger.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Show the properties of a user.',

	res: {
		optional: false, nullable: false,
		oneOf: [
			{
				type: 'object',
				ref: 'UserDetailed',
			},
			{
				type: 'array',
				items: {
					type: 'object',
					ref: 'UserDetailed',
				},
			},
		],
	},

	errors: ['FAILED_TO_RESOLVE_REMOTE_USER', 'NO_SUCH_USER'],
} as const;

export const paramDef = {
	type: 'object',
	anyOf: [
		{
			properties: {
				userId: { type: 'string', format: 'misskey:id' },
			},
			required: ['userId'],
		},
		{
			properties: {
				userIds: { type: 'array', uniqueItems: true, items: {
					type: 'string', format: 'misskey:id',
				} },
			},
			required: ['userIds'],
		},
		{
			properties: {
				username: { type: 'string' },
				host: {
					type: 'string',
					nullable: true,
					description: 'The local host is represented with `null`.',
				},
			},
			required: ['username'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	let user;

	const isAdminOrModerator = me && (me.isAdmin || me.isModerator);

	if (ps.userIds) {
		if (ps.userIds.length === 0) {
			return [];
		}

		const users = await Users.findBy(isAdminOrModerator ? {
			id: In(ps.userIds),
		} : {
			id: In(ps.userIds),
			isSuspended: false,
		});

		// リクエストされた通りに並べ替え
		const _users: User[] = [];
		for (const id of ps.userIds) {
			_users.push(users.find(x => x.id === id)!);
		}

		return await Promise.all(_users.map(u => Users.pack(u, me, {
			detail: true,
		})));
	} else {
		// Lookup user
		if (typeof ps.host === 'string' && typeof ps.username === 'string') {
			user = await resolveUser(ps.username, ps.host).catch(e => {
				apiLogger.warn(`failed to resolve remote user: ${e}`);
				throw new ApiError('FAILED_TO_RESOLVE_REMOTE_USER');
			});
		} else {
			const q: FindOptionsWhere<User> = ps.userId != null
				? { id: ps.userId }
				: { usernameLower: ps.username!.toLowerCase(), host: IsNull() };

			user = await Users.findOneBy(q);
		}

		if (user == null || (!isAdminOrModerator && user.isSuspended)) {
			throw new ApiError('NO_SUCH_USER');
		}

		return await Users.pack(user, me, {
			detail: true,
		});
	}
});
