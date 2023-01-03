import * as speakeasy from 'speakeasy';
import { UserProfiles } from '@/models/index.js';
import { ApiError } from '@/server/api/error.js';
import define from '../../../define.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: ['INTERNAL_ERROR', 'ACCESS_DENIED'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		token: { type: 'string' },
	},
	required: ['token'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const token = ps.token.replace(/\s/g, '');

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	if (profile.twoFactorTempSecret == null) {
		throw new ApiError('INTERNAL_ERROR', 'Two-step verification has not been initiated.');
	}

	const verified = (speakeasy as any).totp.verify({
		secret: profile.twoFactorTempSecret,
		encoding: 'base32',
		token,
	});

	if (!verified) {
		throw new ApiError('ACCESS_DENIED', 'TOTP missmatch');
	}

	await UserProfiles.update(user.id, {
		twoFactorSecret: profile.twoFactorTempSecret,
		twoFactorEnabled: true,
	});
});
