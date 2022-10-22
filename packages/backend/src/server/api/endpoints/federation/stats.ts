import { MoreThan } from 'typeorm';
import { Instances } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import define from '../../define.js';

export const meta = {
	tags: ['federation'],

	requireCredential: true,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const [topSubInstances, topPubInstances] = await Promise.all([
		Instances.find({
			where: {
				followersCount: MoreThan(0),
			},
			order: {
				followersCount: 'DESC',
			},
			take: ps.limit,
		}),
		Instances.find({
			where: {
				followingCount: MoreThan(0),
			},
			order: {
				followingCount: 'DESC',
			},
			take: ps.limit,
		}),
	]);

	return await awaitAll({
		topSubInstances: Instances.packMany(topSubInstances),
		topPubInstances: Instances.packMany(topPubInstances),
	});
});
