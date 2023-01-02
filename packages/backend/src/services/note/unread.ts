import { Note } from '@/models/entities/note.js';
import { publishMainStream } from '@/services/stream.js';
import { User } from '@/models/entities/user.js';
import { Mutings, NoteThreadMutings, NoteUnreads } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { SECOND } from '@/const.js';

export async function insertNoteUnread(userId: User['id'], note: Note, params: {
	// NOTE: if isSpecified is true, isMentioned is always false
	isSpecified: boolean;
	isMentioned: boolean;
}): Promise<void> {
	//#region ignore if muted
	// TODO: The current design does not apply mutes to channels.
	const muted = await Mutings.countBy({
		muterId: userId,
		muteeId: note.userId,
	});
	if (muted) return;

	const threadMuted = await NoteThreadMutings.countBy({
		userId,
		threadId: note.threadId || note.id,
	});
	if (threadMuted) return;
	//#endregion

	const unread = {
		id: genId(),
		noteId: note.id,
		userId,
		isSpecified: params.isSpecified,
		isMentioned: params.isMentioned,
		noteChannelId: note.channelId,
		noteUserId: note.userId,
	};

	await NoteUnreads.insert(unread);

	// Issue the events for unread messages if it hasn't been read after 2 seconds.
	setTimeout(async () => {
		const exist = await NoteUnreads.countBy({ id: unread.id });

		if (!exist) return;

		if (params.isMentioned) {
			publishMainStream(userId, 'unreadMention', note.id);
		}
		if (params.isSpecified) {
			publishMainStream(userId, 'unreadSpecifiedNote', note.id);
		}
		if (note.channelId) {
			publishMainStream(userId, 'unreadChannel', note.id);
		}
	}, 2 * SECOND);
}
