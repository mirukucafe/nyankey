import { UserProfiles } from '@/models/index.js';
import define from '@/server/api/define.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		value: { type: 'boolean' },
	},
	required: ['value'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	await UserProfiles.update(user.id, {
		usePasswordLessLogin: ps.value,
	});
});
