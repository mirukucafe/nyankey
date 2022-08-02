import { Note } from '@/models/entities/note.js';

export function isPureRenote(note: Note): boolean {
	return note.renoteId != null && note.text == null && (note.fileIds == null || note.fileIds.length === 0) && !note.hasPoll;
}
