import { CacheableRemoteUser } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import { apLogger } from '@/remote/activitypub/logger.js';
import { deleteAccount } from '@/services/delete-account.js';

export async function deleteActor(actor: CacheableRemoteUser, uri: string): Promise<string> {
	apLogger.info(`Deleting the Actor: ${uri}`);

	if (actor.uri !== uri) {
		return `skip: delete actor ${actor.uri} !== ${uri}`;
	}

	const user = await Users.findOneBy({ id: actor.id });
	if (!user) {
		// maybe a race condition, relay or something else?
		// anyway, the user is gone now so dont care
		return 'ok: gone';
	}
	if (user.isDeleted) {
		// the actual deletion already happened by an admin, just delete the record
		await Users.delete(actor.id);
	} else {
		await deleteAccount(actor);
	}
}
