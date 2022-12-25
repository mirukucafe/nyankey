import { promisify } from 'node:util';
import * as crypto from 'node:crypto';
import { UserProfiles, AttestationChallenges } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { comparePassword } from '@/misc/password.js';
import { ApiError } from '@/server/api/error.js';
import define from '../../../define.js';
import { hash } from '../../../2fa.js';

const randomBytes = promisify(crypto.randomBytes);

export const meta = {
	requireCredential: true,

	secure: true,

	errors: ['ACCESS_DENIED', 'INTERNAL_ERROR'],
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

	if (!profile.twoFactorEnabled) {
		throw new ApiError('INTERNAL_ERROR', '2fa not enabled');
	}

	// 32 byte challenge
	const entropy = await randomBytes(32);
	const challenge = entropy.toString('base64')
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');

	const challengeId = genId();

	await AttestationChallenges.insert({
		userId: user.id,
		id: challengeId,
		challenge: hash(Buffer.from(challenge, 'utf-8')).toString('hex'),
		createdAt: new Date(),
		registrationChallenge: true,
	});

	return {
		challengeId,
		challenge,
	};
});
