import { promisify } from 'node:util';
import * as cbor from 'cbor';
import { MINUTE } from '@/const.js';
import { comparePassword } from '@/misc/password.js';
import {
	UserProfiles,
	UserSecurityKeys,
	AttestationChallenges,
	Users,
} from '@/models/index.js';
import config from '@/config/index.js';
import { ApiError } from '@/server/api/error.js';
import { publishMainStream } from '@/services/stream.js';
import define from '../../../define.js';
import { procedures, hash } from '../../../2fa.js';

const cborDecodeFirst = promisify(cbor.decodeFirst) as any;
const rpIdHashReal = hash(Buffer.from(config.hostname, 'utf-8'));

export const meta = {
	requireCredential: true,

	secure: true,

	errors: ['ACCESS_DENIED', 'INTERNAL_ERROR', 'NO_SUCH_OBJECT'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		clientDataJSON: { type: 'string' },
		attestationObject: { type: 'string' },
		password: { type: 'string' },
		challengeId: { type: 'string' },
		name: { type: 'string' },
	},
	required: ['clientDataJSON', 'attestationObject', 'password', 'challengeId', 'name'],
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

	const clientData = JSON.parse(ps.clientDataJSON);

	if (clientData.type !== 'webauthn.create') {
		throw new ApiError('INTERNAL_ERROR', 'not a creation attestation');
	}
	if (clientData.origin !== config.scheme + '://' + config.host) {
		throw new ApiError('INTERNAL_ERROR', 'origin mismatch');
	}

	const clientDataJSONHash = hash(Buffer.from(ps.clientDataJSON, 'utf-8'));

	const attestation = await cborDecodeFirst(ps.attestationObject);

	const rpIdHash = attestation.authData.slice(0, 32);
	if (!rpIdHashReal.equals(rpIdHash)) {
		throw new ApiError('INTERNAL_ERROR', 'rpIdHash mismatch');
	}

	const flags = attestation.authData[32];

	// eslint:disable-next-line:no-bitwise
	if (!(flags & 1)) {
		throw new ApiError('INTERNAL_ERROR', 'user not present');
	}

	const authData = Buffer.from(attestation.authData);
	const credentialIdLength = authData.readUInt16BE(53);
	const credentialId = authData.slice(55, 55 + credentialIdLength);
	const publicKeyData = authData.slice(55 + credentialIdLength);
	const publicKey: Map<number, any> = await cborDecodeFirst(publicKeyData);
	if (publicKey.get(3) !== -7) {
		throw new ApiError('INTERNAL_ERROR', 'algorithm mismatch');
	}

	if (!(procedures as any)[attestation.fmt]) {
		throw new ApiError('INTERNAL_ERROR', 'unsupported fmt');
	}

	const verificationData = (procedures as any)[attestation.fmt].verify({
		attStmt: attestation.attStmt,
		authenticatorData: authData,
		clientDataHash: clientDataJSONHash,
		credentialId,
		publicKey,
		rpIdHash,
	});
	if (!verificationData.valid) throw new ApiError('INTERNAL_ERROR', 'signature invalid');

	const attestationChallenge = await AttestationChallenges.findOneBy({
		userId: user.id,
		id: ps.challengeId,
		registrationChallenge: true,
		challenge: hash(clientData.challenge).toString('hex'),
	});

	if (!attestationChallenge) {
		throw new ApiError('NO_SUCH_OBJECT', 'Attestation challenge not found.');
	}

	await AttestationChallenges.delete({
		userId: user.id,
		id: ps.challengeId,
	});

	// Expired challenge
	if (
		new Date().getTime() - attestationChallenge.createdAt.getTime() >=
		5 * MINUTE
	) {
		throw new ApiError('NO_SUCH_OBJECT', 'Attestation challenge expired.');
	}

	const credentialIdString = credentialId.toString('hex');

	await UserSecurityKeys.insert({
		userId: user.id,
		id: credentialIdString,
		lastUsed: new Date(),
		name: ps.name,
		publicKey: verificationData.publicKey.toString('hex'),
	});

	// Publish meUpdated event
	publishMainStream(user.id, 'meUpdated', await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: true,
	}));

	return {
		id: credentialIdString,
		name: ps.name,
	};
});
