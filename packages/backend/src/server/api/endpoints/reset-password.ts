import bcrypt from 'bcryptjs';
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

	errors: {
		noSuchResetRequest: {
			message: 'No such reset request.',
			code: 'NO_SUCH_RESET_REQUEST',
			id: '6382759d-294c-43de-89b3-4e825006ca43',
		},
	},
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
export default define(meta, paramDef, async (ps, user) => {
	const req = await PasswordResetRequests.findOneBy({
		token: ps.token,
	});
	if (req == null) throw new ApiError(meta.errors.noSuchResetRequest);

	// expires after 30 minutes
	// This is a secondary check just in case the expiry task is broken,
	// the expiry task is badly aligned with this expiration or something
	// else strange is going on.
	if (Date.now() - req.createdAt.getTime() > 30 * MINUTE) {
		await PasswordResetRequests.delete(req.id);
		throw new ApiError(meta.errors.noSuchResetRequest);
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(ps.password, salt);

	await UserProfiles.update(req.userId, {
		password: hash,
	});

	await PasswordResetRequests.delete(req.id);
});
