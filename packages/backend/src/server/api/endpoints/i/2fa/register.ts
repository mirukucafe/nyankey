import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import config from '@/config/index.js';
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

	// Generate user's secret key
	const secret = speakeasy.generateSecret({
		length: 32,
	});

	await UserProfiles.update(user.id, {
		twoFactorTempSecret: secret.base32,
	});

	// Get the data URL of the authenticator URL
	const url = speakeasy.otpauthURL({
		secret: secret.base32,
		encoding: 'base32',
		label: user.username,
		issuer: config.host,
	});
	const dataUrl = await QRCode.toDataURL(url);

	return {
		qr: dataUrl,
		url,
		secret: secret.base32,
		label: user.username,
		issuer: config.host,
	};
});
