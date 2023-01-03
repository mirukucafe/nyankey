import { hashPassword } from '@/misc/password.js';
import { UserProfiles, PasswordResetRequests } from '@/models/index.js';
import { DAY, MINUTE } from '@/const.js';
import define from '../define.js';

export const meta = {
	tags: ['reset password'],

	requireCredential: false,

	description: 'Complete the password reset that was previously requested.',

	limit: {
		duration: DAY,
		max: 1,
	},

	errors: ['NO_SUCH_RESET_REQUEST'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		token: { type: 'string' },
		password: { type: 'string' },
	},
	required: ['token', 'password'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const req = await PasswordResetRequests.findOneBy({
		token: ps.token,
	});
	if (req == null) throw new ApiError('NO_SUCH_RESET_REQUEST');

	// expires after 30 minutes
	// This is a secondary check just in case the expiry task is broken,
	// the expiry task is badly aligned with this expiration or something
	// else strange is going on.
	if (Date.now() - req.createdAt.getTime() > 30 * MINUTE) {
		await PasswordResetRequests.delete(req.id);
		throw new ApiError('NO_SUCH_RESET_REQUEST');
	}

	await UserProfiles.update(req.userId, {
		password: await hashPassword(ps.password),
	});

	await PasswordResetRequests.delete(req.id);
});
