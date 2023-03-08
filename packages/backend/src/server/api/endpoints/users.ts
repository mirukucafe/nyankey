import { DAY } from '@/const.js';
import { Users } from '@/models/index.js';
import define from '@/server/api/define.js';
import { generateMutedUserQueryForUsers } from '@/server/api/common/generate-muted-user-query.js';
import { generateBlockQueryForUsers } from '@/server/api/common/generate-block-query.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserDetailed',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		sort: { type: 'string', enum: ['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt'] },
		state: { type: 'string', enum: ['all', 'admin', 'moderator', 'adminOrModerator', 'alive'], default: 'all' },
		origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'local' },
		hostname: {
			type: 'string',
			nullable: true,
			default: null,
			description: 'The local host is represented with `null`.',
		},
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = Users.createQueryBuilder('user');
	query.where('user.isExplorable');

	switch (ps.state) {
		case 'admin': query.andWhere('user.isAdmin'); break;
		case 'moderator': query.andWhere('user.isModerator'); break;
		case 'adminOrModerator': query.andWhere('user.isAdmin OR user.isModerator'); break;
		case 'alive': query.andWhere('user.updatedAt > :date', { date: new Date(Date.now() - 5 * DAY) }); break;
	}

	switch (ps.origin) {
		case 'local': query.andWhere('user.host IS NULL'); break;
		case 'remote': query.andWhere('user.host IS NOT NULL'); break;
	}

	if (ps.hostname) {
		query.andWhere('user.host = :hostname', { hostname: ps.hostname.toLowerCase() });
	}

	switch (ps.sort) {
		case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
		case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
		case '+createdAt': query.orderBy('user.createdAt', 'DESC'); break;
		case '-createdAt': query.orderBy('user.createdAt', 'ASC'); break;
		case '+updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'DESC'); break;
		case '-updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'ASC'); break;
		default: query.orderBy('user.id', 'ASC'); break;
	}

	if (me) generateMutedUserQueryForUsers(query, me);
	if (me) generateBlockQueryForUsers(query, me);

	query.take(ps.limit);
	query.skip(ps.offset);

	const users = await query.getMany();

	return await Users.packMany(users, me, { detail: true });
});
