import * as foundkey from 'foundkey-js';
import config from '@/config/index.js';
import { Notes } from '@/models/index.js';
import { Note } from '@/models/entities/note.js';
import { IActivity } from '@/remote/activitypub/types.js';
import renderNote from '@/remote/activitypub/renderer/note.js';
import renderCreate from '@/remote/activitypub/renderer/create.js';
import renderAnnounce from '@/remote/activitypub/renderer/announce.js';

export async function renderNoteOrRenoteActivity(note: Note): Promise<IActivity> {
	if (foundkey.entities.isPureRenote(note)) {
		const renote = await Notes.findOneByOrFail({ id: note.renoteId });
		return renderAnnounce(renote.uri ?? `${config.url}/notes/${renote.id}`, note);
	} else {
		return renderCreate(await renderNote(note, false), note);
	}
}
