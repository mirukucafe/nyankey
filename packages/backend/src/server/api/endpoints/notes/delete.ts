import deleteNote from '@/services/note/delete.js';
import { Users } from '@/models/index.js';
import { SECOND, HOUR } from '@/const.js';
import define from '../../define.js';
import { getNote } from '../../common/getters.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:notes',

	limit: {
		duration: HOUR,
		max: 30,
		minInterval: 10 * SECOND,
		key: 'delete',
	},

	v2: {
		method: 'delete',
		alias: 'notes/:noteId',
		pathParameters: ['noteId'],
	},

	errors: ['ACCESS_DENIED', 'NO_SUCH_NOTE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const note = await getNote(ps.noteId, user).catch(err => {
		if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE');
		throw err;
	});

	if ((!user.isAdmin && !user.isModerator) && (note.userId !== user.id)) {
		throw new ApiError('ACCESS_DENIED');
	}

	// この操作を行うのが投稿者とは限らない(例えばモデレーター)ため
	await deleteNote(await Users.findOneByOrFail({ id: note.userId }), note);
});
