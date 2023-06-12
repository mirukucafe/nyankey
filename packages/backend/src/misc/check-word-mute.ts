import RE2 from 're2';
import { Note } from '@/models/entities/note.js';
import { User } from '@/models/entities/user.js';

type NoteLike = {
	userId: Note['userId'];
	text: Note['text'];
	cw: Note['cw'];
};

type UserLike = {
	id: User['id'];
};

export async function checkWordMute(note: NoteLike, me: UserLike | null | undefined, mutedWords: Array<string | string[]>): Promise<boolean> {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

	if (mutedWords.length > 0) {
		const text = ((note.cw ?? '') + '\n' + (note.text ?? '')).trim();

		if (text === '') return false;
		const textLower = text.toLowerCase();

		const matched = mutedWords.some(filter => {
			if (Array.isArray(filter)) {
				return filter.every(keyword => textLower.includes(keyword.toLowerCase()));
			} else {
				// represents RegExp
				const regexp = filter.match(/^\/(.+)\/(.*)$/);

				// This should never happen due to input sanitisation.
				if (!regexp) return false;

				try {
					return new RE2(regexp[1], regexp[2]).test(text);
				} catch (err) {
					// This should never happen due to input sanitisation.
					return false;
				}
			}
		});

		if (matched) return true;
	}

	return false;
}
