import { NoteFavorites } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getNote } from '../../../common/getters.js';

export const meta = {
	tags: ['notes', 'favorites'],

	requireCredential: true,

	kind: 'write:favorites',

	errors: ['NO_SUCH_NOTE', 'NOT_FAVORITED'],
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
	// Get favoritee
	const note = await getNote(ps.noteId, user).catch(err => {
		if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE');
		throw err;
	});

	// if already favorited
	const exist = await NoteFavorites.findOneBy({
		noteId: note.id,
		userId: user.id,
	});

	if (exist == null) throw new ApiError('NOT_FAVORITED');

	// Delete favorite
	await NoteFavorites.delete(exist.id);
});
