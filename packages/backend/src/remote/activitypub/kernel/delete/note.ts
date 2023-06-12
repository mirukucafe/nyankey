import { IRemoteUser } from '@/models/entities/user.js';
import { deleteNotes } from '@/services/note/delete.js';
import { getApLock } from '@/misc/app-lock.js';
import { deleteMessage } from '@/services/messages/delete.js';
import { DbResolver } from '@/remote/activitypub/db-resolver.js';
import { apLogger } from '@/remote/activitypub/logger.js';

export default async function(actor: IRemoteUser, uri: string): Promise<string> {
	apLogger.info(`Deleting the Note: ${uri}`);

	const unlock = await getApLock(uri);

	try {
		const dbResolver = new DbResolver();
		const note = await dbResolver.getNoteFromApId(uri);

		if (note == null) {
			const message = await dbResolver.getMessageFromApId(uri);
			if (message == null) return 'skip: message not found';

			if (message.userId !== actor.id) {
				return 'skip: cant delete other actors message';
			}

			await deleteMessage(message);
			return 'ok: message deleted';
		} else {
			if (note.userId !== actor.id) {
				return 'skip: cant delete other actors note';
			}

			await deleteNotes([note], actor);
			return 'ok: note deleted';
		}
	} finally {
		unlock();
	}
}
