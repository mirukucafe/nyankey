import { Brackets, SelectQueryBuilder } from 'typeorm';
import { User } from '@/models/entities/user.js';
import { Followings } from '@/models/index.js';

export function generateVisibilityQuery(q: SelectQueryBuilder<any>, me?: { id: User['id'] } | null) {
	if (me == null) {
		q.andWhere('note_visible(note.id, null)');
	} else {
		q.andWhere('note_visible(note.id, :meId)');
		q.setParameters({ meId: me.id });
	}
}
