import { ClipNotes, Clips } from '@/models/index.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getNote } from '../../common/getters.js';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: true,

	kind: 'write:account',

	errors: ['NO_SUCH_CLIP', 'NO_SUCH_NOTE', 'NOT_CLIPPED'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		clipId: { type: 'string', format: 'misskey:id' },
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['clipId', 'noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const clip = await Clips.findOneBy({
		id: ps.clipId,
		userId: user.id,
	});

	if (clip == null) throw new ApiError('NO_SUCH_CLIP');

	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE');
		throw e;
	});

	const { affected } = await ClipNotes.delete({
		noteId: note.id,
		clipId: clip.id,
	});

	if (affected === 0) throw new ApiError('NOT_CLIPPED');
});
