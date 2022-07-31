import { Note } from '@/models/entities/note.js';

export function isPureRenote(note: Note): boolean {
	return note.renoteId != null && note.text == null && (renote.fileIds == null || renote.fileIds.length === 0) && !note.hasPoll;
}
