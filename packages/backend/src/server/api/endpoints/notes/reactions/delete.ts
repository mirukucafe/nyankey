import { deleteReaction } from '@/services/note/reaction/delete.js';
import { SECOND, HOUR } from '@/const.js';
import define from '../../../define.js';
import { getNote } from '../../../common/getters.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['reactions', 'notes'],

	requireCredential: true,

	kind: 'write:reactions',

	limit: {
		duration: HOUR,
		max: 30,
		minInterval: 10 * SECOND,
		key: 'delete',
	},

	errors: ['NO_SUCH_NOTE', 'NOT_REACTED'],
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
	await deleteReaction(user, note).catch(e => {
		if (e.id === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') throw new ApiError('NOT_REACTED');
		throw e;
	});
});
