import { comparePassword } from '@/misc/password.js';
import { UserProfiles } from '@/models/index.js';
import { ApiError } from '@/server/api/error.js';
import define from '../../../define.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: ['ACCESS_DENIED'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	if (!(await comparePassword(ps.password, profile.password!))) {
		throw new ApiError('ACCESS_DENIED');
	}

	await UserProfiles.update(user.id, {
		twoFactorSecret: null,
		twoFactorEnabled: false,
	});
});
