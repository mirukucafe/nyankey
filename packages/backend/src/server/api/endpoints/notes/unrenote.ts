import deleteNote from '@/services/note/delete.js';
import { Notes, Users } from '@/models/index.js';
import { SECOND, HOUR } from '@/const.js';
import define from '@/server/api/define.js';
import { getNote } from '@/server/api/common/getters.js';
import { ApiError } from '@/server/api/error.js';

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
		alias: 'notes/:noteId/renotes',
		pathParameters: ['noteId'],
	},

	errors: ['NO_SUCH_NOTE'],
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

	const renotes = await Notes.findBy({
		userId: user.id,
		renoteId: note.id,
	});

	for (const note of renotes) {
		deleteNote(await Users.findOneByOrFail({ id: user.id }), note);
	}
});
