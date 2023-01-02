import { IsNull } from 'typeorm';
import { Users, Followings, UserProfiles } from '@/models/index.js';
import { toPunyNullable } from '@/misc/convert-host.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Show everyone that this user is following.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Following',
		},
	},

	errors: ['ACCESS_DENIED', 'NO_SUCH_USER'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
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
				username: { type: 'string' },
				host: {
					type: 'string',
					nullable: true,
					description: 'The local host is represented with `null`.',
				},
			},
			required: ['username', 'host'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const user = await Users.findOneBy(ps.userId != null
		? { id: ps.userId }
		: { usernameLower: ps.username!.toLowerCase(), host: toPunyNullable(ps.host) ?? IsNull() });

	if (user == null) throw new ApiError('NO_SUCH_USER');

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	if (profile.ffVisibility === 'private') {
		if (me == null || (me.id !== user.id)) {
			throw new ApiError('ACCESS_DENIED');
		}
	} else if (profile.ffVisibility === 'followers') {
		if (me == null) {
			throw new ApiError('ACCESS_DENIED');
		} else if (me.id !== user.id) {
			const following = await Followings.countBy({
				followeeId: user.id,
				followerId: me.id,
			});
			if (!following) {
				throw new ApiError('ACCESS_DENIED');
			}
		}
	}

	const query = makePaginationQuery(Followings.createQueryBuilder('following'), ps.sinceId, ps.untilId)
		.andWhere('following.followerId = :userId', { userId: user.id })
		.innerJoinAndSelect('following.followee', 'followee');

	const followings = await query
		.take(ps.limit)
		.getMany();

	return await Followings.packMany(followings, me, { populateFollowee: true });
});
