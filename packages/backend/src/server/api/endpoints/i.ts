import { Users } from '@/models/index.js';
import define from '@/server/api/define.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	description: 'Show the representation of the authenticated user.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user, token) => {
	const isSecure = token == null;

	// The user passed here may be cached and out of date, so only the id is passed.
	return await Users.pack<true, true>(user.id, user, {
		detail: true,
		includeSecrets: isSecure,
	});
});
