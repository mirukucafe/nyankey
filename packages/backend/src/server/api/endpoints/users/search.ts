import { Brackets } from 'typeorm';
import { MONTH } from '@/const.js';
import { UserProfiles, Users } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import define from '@/server/api/define.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Search for users.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string' },
		offset: { type: 'integer', default: 0 },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		origin: { type: 'string', enum: ['local', 'remote', 'combined'], default: 'combined' },
		detail: { type: 'boolean', default: true },
	},
	required: ['query'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const activeThreshold = new Date(Date.now() - MONTH);

	const isUsername = ps.query.startsWith('@');

	let users: User[] = [];

	if (isUsername) {
		const usernameQuery = Users.createQueryBuilder('user')
			.where('user.usernameLower LIKE :username', { username: ps.query.replace('@', '').toLowerCase() + '%' })
			.andWhere(new Brackets(qb => { qb
				.where('user.updatedAt IS NULL')
				.orWhere('user.updatedAt > :activeThreshold', { activeThreshold });
			}))
			.andWhere('NOT user.isSuspended');

		if (ps.origin === 'local') {
			usernameQuery.andWhere('user.host IS NULL');
		} else if (ps.origin === 'remote') {
			usernameQuery.andWhere('user.host IS NOT NULL');
		}

		users = await usernameQuery
			.orderBy('user.updatedAt', 'DESC', 'NULLS LAST')
			.take(ps.limit)
			.skip(ps.offset)
			.getMany();
	} else {
		const nameQuery = Users.createQueryBuilder('user')
			.where(new Brackets(qb => {
				qb.where('user.name ILIKE :query', { query: '%' + ps.query + '%' });

				// Also search username if it qualifies as username
				if (Users.validateLocalUsername(ps.query)) {
					qb.orWhere('user.usernameLower LIKE :username', { username: '%' + ps.query.toLowerCase() + '%' });
				}
			}))
			.andWhere(new Brackets(qb => { qb
				.where('user.updatedAt IS NULL')
				.orWhere('user.updatedAt > :activeThreshold', { activeThreshold });
			}))
			.andWhere('NOT user.isSuspended');

		if (ps.origin === 'local') {
			nameQuery.andWhere('user.host IS NULL');
		} else if (ps.origin === 'remote') {
			nameQuery.andWhere('user.host IS NOT NULL');
		}

		users = await nameQuery
			.orderBy('user.updatedAt', 'DESC', 'NULLS LAST')
			.take(ps.limit)
			.skip(ps.offset)
			.getMany();

		if (users.length < ps.limit) {
			const profQuery = UserProfiles.createQueryBuilder('prof')
				.select('prof.userId')
				.where('prof.description ILIKE :query', { query: '%' + ps.query + '%' });

			if (ps.origin === 'local') {
				profQuery.andWhere('prof.userHost IS NULL');
			} else if (ps.origin === 'remote') {
				profQuery.andWhere('prof.userHost IS NOT NULL');
			}

			const query = Users.createQueryBuilder('user')
				.where(`user.id IN (${ profQuery.getQuery() })`)
				// don't show users twice, but also make sure there is at least one value otherwise this is an invalid query
				.andWhere('user.id NOT IN (:...ids)', { ids: users.length === 0 ? [''] : users.map(user => user.id) })
				.andWhere(new Brackets(qb => { qb
					.where('user.updatedAt IS NULL')
					.orWhere('user.updatedAt > :activeThreshold', { activeThreshold });
				}))
				.andWhere('NOT user.isSuspended')
				.setParameters(profQuery.getParameters());

			users = users.concat(await query
				.orderBy('user.updatedAt', 'DESC', 'NULLS LAST')
				.take(ps.limit)
				.skip(ps.offset)
				.getMany(),
			);
		}
	}

	return await Users.packMany(users, me, { detail: ps.detail });
});
