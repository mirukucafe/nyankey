import { randomBytes } from 'node:crypto';
import { IsNull } from 'typeorm';
import Koa from 'koa';
import * as speakeasy from 'speakeasy';
import { SECOND, MINUTE, HOUR } from '@/const.js';
import config from '@/config/index.js';
import { Users, Signins, UserProfiles, UserSecurityKeys, AttestationChallenges } from '@/models/index.js';
import { ILocalUser } from '@/models/entities/user.js';
import { genId } from '@/misc/gen-id.js';
import { getIpHash } from '@/misc/get-ip-hash.js';
import { comparePassword, hashPassword, isOldAlgorithm } from '@/misc/password.js';
import signin from '../common/signin.js';
import { verifyLogin, hash } from '../2fa.js';
import { limiter } from '../limiter.js';
import { ApiError, errors } from '../error.js';

export default async (ctx: Koa.Context) => {
	ctx.set('Access-Control-Allow-Origin', config.url);
	ctx.set('Access-Control-Allow-Credentials', 'true');

	const body = ctx.request.body as any;
	const { username, password, token } = body;

	function error(e: keyof errors, info?: Record<string, any>): void {
		new ApiError(e, info).apply(ctx, 'signin');
	}

	// not more than 1 attempt per second and not more than 10 attempts per hour
	await limiter({ key: 'signin', duration: HOUR, max: 10, minInterval: SECOND }, getIpHash(ctx.ip));

	if (typeof username !== 'string') {
		error('INVALID_PARAM', { param: 'username', reason: 'not a string' });
		return;
	}

	if (typeof password !== 'string') {
		error('INVALID_PARAM', { param: 'password', reason: 'not a string' });
		return;
	}

	if (token != null && typeof token !== 'string') {
		error('INVALID_PARAM', { param: 'token', reason: 'provided but not a string' });
		return;
	}

	// Fetch user
	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: IsNull(),
	}) as ILocalUser;

	if (user == null) {
		error('NO_SUCH_USER');
		return;
	}

	if (user.isSuspended) {
		error('SUSPENDED');
		return;
	}

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	// Compare password
	const same = await comparePassword(password, profile.password!);

	if (same && isOldAlgorithm(profile.password!)) {
		profile.password = await hashPassword(password);
		await UserProfiles.save(profile);
	}

	async function fail(): void {
		// Append signin history
		await Signins.insert({
			id: genId(),
			createdAt: new Date(),
			userId: user.id,
			ip: ctx.ip,
			headers: ctx.headers,
			success: false,
		});

		error('ACCESS_DENIED');
	}

	if (!profile.twoFactorEnabled) {
		if (same) {
			signin(ctx, user);
			return;
		} else {
			await fail();
			return;
		}
	}

	if (token) {
		if (!same) {
			await fail();
			return;
		}

		const verified = (speakeasy as any).totp.verify({
			secret: profile.twoFactorSecret,
			encoding: 'base32',
			token,
			window: 2,
		});

		if (verified) {
			signin(ctx, user);
			return;
		} else {
			await fail();
			return;
		}
	} else if (body.credentialId) {
		if (!same && !profile.usePasswordLessLogin) {
			await fail();
			return;
		}

		const clientDataJSON = Buffer.from(body.clientDataJSON, 'hex');
		const clientData = JSON.parse(clientDataJSON.toString('utf-8'));
		const challenge = await AttestationChallenges.findOneBy({
			userId: user.id,
			id: body.challengeId,
			registrationChallenge: false,
			challenge: hash(clientData.challenge).toString('hex'),
		});

		if (!challenge) {
			await fail();
			return;
		}

		await AttestationChallenges.delete({
			userId: user.id,
			id: body.challengeId,
		});

		if (new Date().getTime() - challenge.createdAt.getTime() >= 5 * MINUTE) {
			await fail();
			return;
		}

		const securityKey = await UserSecurityKeys.findOneBy({
			id: Buffer.from(
				body.credentialId
					.replace(/-/g, '+')
					.replace(/_/g, '/'),
				'base64',
			).toString('hex'),
		});

		if (!securityKey) {
			await fail();
			return;
		}

		const isValid = verifyLogin({
			publicKey: Buffer.from(securityKey.publicKey, 'hex'),
			authenticatorData: Buffer.from(body.authenticatorData, 'hex'),
			clientDataJSON,
			clientData,
			signature: Buffer.from(body.signature, 'hex'),
			challenge: challenge.challenge,
		});

		if (isValid) {
			signin(ctx, user);
			return;
		} else {
			await fail();
			return;
		}
	} else {
		if (!same && !profile.usePasswordLessLogin) {
			await fail();
			return;
		}

		const keys = await UserSecurityKeys.findBy({
			userId: user.id,
		});

		if (keys.length === 0) {
			await fail();
			return;
		}

		// 32 byte challenge
		const challenge = randomBytes(32).toString('base64')
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');

		const challengeId = genId();

		await AttestationChallenges.insert({
			userId: user.id,
			id: challengeId,
			challenge: hash(Buffer.from(challenge, 'utf-8')).toString('hex'),
			createdAt: new Date(),
			registrationChallenge: false,
		});

		ctx.body = {
			challenge,
			challengeId,
			securityKeys: keys.map(key => ({
				id: key.id,
			})),
		};
		ctx.status = 200;
		return;
	}
	// never get here
};
