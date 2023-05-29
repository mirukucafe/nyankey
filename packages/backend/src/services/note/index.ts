import es from '@/db/elasticsearch.js';
import config from '@/config/index.js';
import { Note } from '@/models/entities/note.js';
import { UserProfiles } from '@/models/index.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { Cache } from '@/misc/cache.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import { MINUTE } from '@/const.js';

export const mutedWordsCache = new Cache<{ userId: UserProfile['userId']; mutedWords: UserProfile['mutedWords']; }[]>(
	5 * MINUTE,
	() => UserProfiles.find({
		where: {
			enableWordMute: true,
		},
		select: ['userId', 'mutedWords'],
	}),
);

export function index(note: Note): void {
	if (note.text == null || config.elasticsearch == null) return;

	es.index({
		index: config.elasticsearch.index || 'misskey_note',
		id: note.id.toString(),
		body: {
			text: normalizeForSearch(note.text),
			userId: note.userId,
			userHost: note.userHost,
		},
	});
}
