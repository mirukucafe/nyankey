import { User } from '@/models/entities/user.js';
import { NoteWatchings } from '@/models/index.js';
import { Note } from '@/models/entities/note.js';

export async function unwatch(me: User['id'], note: Note): Promise<void> {
	await NoteWatchings.delete({
		noteId: note.id,
		userId: me,
	});
}
