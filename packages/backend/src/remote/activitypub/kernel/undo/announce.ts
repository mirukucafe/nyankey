import { Notes } from '@/models/index.js';
import { IRemoteUser } from '@/models/entities/user.js';
import { deleteNotes } from '@/services/note/delete.js';
import { IAnnounce, getApId } from '@/remote/activitypub/type.js';

export const undoAnnounce = async (actor: IRemoteUser, activity: IAnnounce): Promise<string> => {
	const uri = getApId(activity);

	const note = await Notes.findOneBy({
		uri,
		userId: actor.id,
	});

	if (!note) return 'skip: no such Announce';

	await deleteNotes([note], actor);
	return 'ok: deleted';
};
