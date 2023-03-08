import { SelectQueryBuilder } from 'typeorm';
import { User } from '@/models/entities/user.js';
import { Note } from '@/models/entities/note.js';
import { Notes } from '@/models/index.js';

export function visibilityQuery(q: SelectQueryBuilder<Note>, meId?: User['id'] | null = null): SelectQueryBuilder<Note> {
	const superQuery = Notes.createQueryBuilder()
		.from(() => q, 'note');

	if (meId == null) {
		superQuery.where('note_visible(note.id, null);');
	} else {
		superQuery.where('note_visible(note.id, :meId)', { meId });
	}

	return q;
}
