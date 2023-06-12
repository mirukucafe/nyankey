import { v4 as uuid } from 'uuid';
import { IsNull } from 'typeorm';
import { genRsaKeyPair } from '@/misc/gen-key-pair.js';
import { hashPassword } from '@/misc/password.js';
import { Users } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import { genId } from '@/misc/gen-id.js';
import { UserKeypair } from '@/models/entities/user-keypair.js';
import { UsedUsername } from '@/models/entities/used-username.js';
import { db } from '@/db/postgre.js';
import generateNativeUserToken from '@/server/api/common/generate-native-user-token.js';

export async function getSystemUser(username: string): Promise<User> {
	const exist = await Users.findBy({
		usernameLower: username.toLowerCase(),
		host: IsNull(),
	});

	if (exist) return exist;

	const password = await hashPassword(uuid());

	// Generate secret
	const secret = generateNativeUserToken();

	const keyPair = await genRsaKeyPair(4096);

	let account!: User;

	// Start transaction
	await db.transaction(async transactionalEntityManager => {
		account = await transactionalEntityManager.insert(User, {
			id: genId(),
			createdAt: new Date(),
			username,
			usernameLower: username.toLowerCase(),
			host: null,
			token: secret,
			isAdmin: false,
			isLocked: true,
			isExplorable: false,
			isBot: true,
		}).then(x => transactionalEntityManager.findOneByOrFail(User, x.identifiers[0]));

		await transactionalEntityManager.insert(UserKeypair, {
			publicKey: keyPair.publicKey,
			privateKey: keyPair.privateKey,
			userId: account.id,
		});

		await transactionalEntityManager.insert(UserProfile, {
			userId: account.id,
			autoAcceptFollowed: false,
			password,
		});

		await transactionalEntityManager.insert(UsedUsername, {
			createdAt: new Date(),
			username: username.toLowerCase(),
		});
	});

	return account;
}
