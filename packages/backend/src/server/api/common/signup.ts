import { generateKeyPair } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import { User } from '@/models/entities/user.js';
import { Users, UsedUsernames } from '@/models/index.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import { genId } from '@/misc/gen-id.js';
import { toPunyNullable } from '@/misc/convert-host.js';
import { UserKeypair } from '@/models/entities/user-keypair.js';
import { usersChart } from '@/services/chart/index.js';
import { UsedUsername } from '@/models/entities/used-username.js';
import { db } from '@/db/postgre.js';
import { ApiError } from '@/server/api/error.js';
import generateUserToken from './generate-native-user-token.js';

export async function signup(opts: {
	username: User['username'];
	password?: string | null;
	passwordHash?: UserProfile['password'] | null;
	host?: string | null;
}) {
	const { username, password, passwordHash, host } = opts;
	let hash = passwordHash;

	// Validate username
	if (!Users.validateLocalUsername(username)) {
		throw new ApiError({
			message: 'This username is invalid.',
			code: 'INVALID_USERNAME',
			id: 'ece89f3c-d845-4d9a-850b-1735285e8cd4',
			kind: 'client',
			httpStatusCode: 400,
		});
	}

	if (password != null && passwordHash == null) {
		// Validate password
		if (!Users.validatePassword(password)) {
			throw new ApiError({
				message: 'This password is invalid.',
				code: 'INVALID_PASSWORD',
				id: 'a941905b-fe7b-43e2-8ecd-50ad3a2287ab',
				kind: 'client',
				httpStatusCode: 400,
			});
		}

		// Generate hash of password
		const salt = await bcrypt.genSalt(8);
		hash = await bcrypt.hash(password, salt);
	}

	// Generate secret
	const secret = generateUserToken();

	const duplicateUsernameError = {
		message: 'This username is not available.',
		code: 'USED_USERNAME',
		id: '7ddd595e-6860-4593-93c5-9fdbcb80cd81',
		kind: 'client',
		httpStatusCode: 409,
	};

	// Check username duplication
	if (await Users.findOneBy({ usernameLower: username.toLowerCase(), host: IsNull() })) {
		throw new ApiError(duplicateUsernameError);
	}

	// Check deleted username duplication
	if (await UsedUsernames.findOneBy({ username: username.toLowerCase() })) {
		throw new ApiError(duplicateUsernameError);
	}

	const keyPair = await new Promise<string[]>((res, rej) =>
		generateKeyPair('rsa', {
			modulusLength: 4096,
			publicKeyEncoding: {
				type: 'spki',
				format: 'pem',
			},
			privateKeyEncoding: {
				type: 'pkcs8',
				format: 'pem',
				cipher: undefined,
				passphrase: undefined,
			},
		} as any, (err, publicKey, privateKey) =>
			err ? rej(err) : res([publicKey, privateKey]),
		));

	let account!: User;

	// Start transaction
	await db.transaction(async transactionalEntityManager => {
		const exist = await transactionalEntityManager.findOneBy(User, {
			usernameLower: username.toLowerCase(),
			host: IsNull(),
		});

		if (exist) throw new ApiError(duplicateUsernameError);

		account = await transactionalEntityManager.save(new User({
			id: genId(),
			createdAt: new Date(),
			username,
			usernameLower: username.toLowerCase(),
			host: toPunyNullable(host),
			token: secret,
			isAdmin: (await Users.countBy({
				host: IsNull(),
			})) === 0,
		}));

		await transactionalEntityManager.save(new UserKeypair({
			publicKey: keyPair[0],
			privateKey: keyPair[1],
			userId: account.id,
		}));

		await transactionalEntityManager.save(new UserProfile({
			userId: account.id,
			autoAcceptFollowed: true,
			password: hash,
		}));

		await transactionalEntityManager.save(new UsedUsername({
			createdAt: new Date(),
			username: username.toLowerCase(),
		}));
	});

	usersChart.update(account, true);

	return { account, secret };
}
