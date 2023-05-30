import { IRemoteUser } from '@/models/entities/user.js';
import { createReaction } from '@/services/note/reaction/create.js';
import { ILike, getApId } from '../type.js';
import { fetchNote } from '../models/note.js';
import { extractEmojis } from '../models/tag.js';

export default async (actor: IRemoteUser, activity: ILike) => {
	const targetUri = getApId(activity.object);

	const note = await fetchNote(targetUri);
	if (!note) return `skip: target note not found ${targetUri}`;

	await extractEmojis(activity.tag || [], actor.host).catch(() => null);

	return await createReaction(actor, note, activity.content || activity.name).catch(e => {
		if (e.id === '51c42bb4-931a-456b-bff7-e5a8a70dd298') {
			return 'skip: already reacted';
		} else {
			throw e;
		}
	}).then(() => 'ok');
};
