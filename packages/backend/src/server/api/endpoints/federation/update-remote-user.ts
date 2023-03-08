import { Resolver } from '@/remote/activitypub/resolver.js';
import { updatePerson } from '@/remote/activitypub/models/person.js';
import define from '@/server/api/define.js';
import { getRemoteUser } from '@/server/api/common/getters.js';

export const meta = {
	tags: ['federation'],

	requireCredential: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const user = await getRemoteUser(ps.userId);
	await updatePerson(user.uri!, new Resolver());
});
