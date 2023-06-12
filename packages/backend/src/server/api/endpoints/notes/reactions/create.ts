import { createReaction } from '@/services/note/reaction/create.js';
import define from '@/server/api/define.js';
import { getNote } from '@/server/api/common/getters.js';
import { ApiError } from '@/server/api/error.js';
import { HOUR, SECOND } from '@/const.js';
import { limiter } from '@/server/api/limiter.js';
import { NoteReactions } from '@/models/index.js';

export const meta = {
	tags: ['reactions', 'notes'],

	description: 'Add a reaction to a note. If there already is a reaction to this note, deletes it and is consequently subject to the `delete` rate limiting group as if using `notes/reactions/delete`.',

	requireCredential: true,

	kind: 'write:reactions',

	errors: ['NO_SUCH_NOTE', 'ALREADY_REACTED', 'BLOCKED', 'RATE_LIMIT_EXCEEDED'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		reaction: { type: 'string' },
	},
	required: ['noteId', 'reaction'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const [note, reactionCount] = await Promise.all([
		getNote(ps.noteId, user).catch(err => {
			if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE');
			throw err;
		}),
		NoteReactions.countBy({
			noteId: ps.noteId,
			userId: user.id,
		}),
	]);

	if (reactionCount > 0) {
		const limit = {
			key: 'delete',
			duration: HOUR,
			max: 30,
			minInterval: 10 * SECOND,
		};
		await limiter(limit, user.id);
	}

	await createReaction(user, note, ps.reaction).catch(e => {
		if (e.id === '51c42bb4-931a-456b-bff7-e5a8a70dd298') throw new ApiError('ALREADY_REACTED');
		if (e.id === 'e70412a4-7197-4726-8e74-f3e0deb92aa7') throw new ApiError('BLOCKED');
		throw e;
	});
	return;
});
