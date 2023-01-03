import { Note } from '@/models/entities/note.js';

export function isPureRenote(note: Note): note is Note & { renoteId: string, text: null, fileIds: null | never[], hasPoll: false } {
	return note.renoteId != null
		&& note.text == null
		&& (
			note.fileIds == null
			|| note.fileIds.length === 0
		)
		&& !note.hasPoll;
}
